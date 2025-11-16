import { handleApiError } from '@/lib/error-handling';
import { getActiveUser } from '@/lib/firebase-auth-helpers';
import { prisma } from '@/lib/prisma';
import { apiRateLimit } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const startConversationSchema = z.object({
  recipientId: z.string().min(1, 'ID odbiorcy jest wymagane'),
  content: z.string().min(1, 'Treść wiadomości jest wymagana').max(1000, 'Wiadomość jest za długa'),
});

// POST /api/messages/start - Rozpocznij nową konwersację
export async function POST(request: NextRequest) {
  try {
    const authResult = await getActiveUser(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const rateLimitResponse = apiRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    const validatedData = startConversationSchema.parse(body);

    // Sprawdź czy odbiorca istnieje
    const recipient = await prisma.user.findUnique({
      where: { id: validatedData.recipientId },
      select: { id: true, isActive: true },
    });

    if (!recipient) {
      return NextResponse.json({ error: 'Odbiorca nie istnieje' }, { status: 404 });
    }

    if (!recipient.isActive) {
      return NextResponse.json({ error: 'Odbiorca nie jest aktywny' }, { status: 400 });
    }

    if (recipient.id === authResult.userId) {
      return NextResponse.json(
        { error: 'Nie możesz wysłać wiadomości do siebie' },
        { status: 400 }
      );
    }

    // Sprawdź czy konwersacja już istnieje
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          {
            participant1Id: authResult.userId,
            participant2Id: validatedData.recipientId,
          },
          {
            participant1Id: validatedData.recipientId,
            participant2Id: authResult.userId,
          },
        ],
      },
    });

    if (existingConversation) {
      return NextResponse.json(
        { error: 'Konwersacja z tym użytkownikiem już istnieje' },
        { status: 400 }
      );
    }

    // Utwórz nową konwersację i pierwszą wiadomość w transakcji
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await prisma.$transaction(async (tx: any) => {
      // Utwórz konwersację
      const conversation = await tx.conversation.create({
        data: {
          participant1Id: authResult.userId,
          participant2Id: validatedData.recipientId,
        },
      });

      // Utwórz pierwszą wiadomość
      const message = await tx.userMessage.create({
        data: {
          conversationId: conversation.id,
          senderId: authResult.userId,
          content: validatedData.content,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              image: true,
            },
          },
        },
      });

      // Zaktualizuj czas ostatniej wiadomości
      await tx.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      });

      return { conversation, message };
    });

    return NextResponse.json(
      {
        conversation: {
          id: result.conversation.id,
          participant1Id: result.conversation.participant1Id,
          participant2Id: result.conversation.participant2Id,
        },
        message: {
          id: result.message.id,
          content: result.message.content,
          senderId: result.message.senderId,
          senderName:
            `${result.message.sender.firstName || ''} ${result.message.sender.lastName || ''}`.trim() ||
            'Użytkownik',
          senderImage: result.message.sender.image,
          createdAt: result.message.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, request, { endpoint: 'messages/start' });
  }
}
