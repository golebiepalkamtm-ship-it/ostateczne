import { handleApiError } from '@/lib/error-handling';
import { getActiveUser } from '@/lib/firebase-auth-helpers';
import { prisma } from '@/lib/prisma';
import { apiRateLimit } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const sendMessageSchema = z.object({
  content: z.string().min(1, 'Treść wiadomości jest wymagana').max(1000, 'Wiadomość jest za długa'),
});

// GET /api/messages/[conversationId] - Pobierz wiadomości z konwersacji
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  try {
    const authResult = await getActiveUser(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const rateLimitResponse = apiRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const skip = (page - 1) * limit;

    // Sprawdź czy użytkownik ma dostęp do konwersacji
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ participant1Id: authResult.userId }, { participant2Id: authResult.userId }],
      },
      include: {
        participant1: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            image: true,
          },
        },
        participant2: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Konwersacja nie istnieje lub brak dostępu' },
        { status: 404 },
      );
    }

    // Pobierz wiadomości
    const messages = await prisma.userMessage.findMany({
      where: { conversationId },
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
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Oznacz wiadomości jako przeczytane (tylko te od innych użytkowników)
    await prisma.userMessage.updateMany({
      where: {
        conversationId,
        senderId: { not: authResult.userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    // Przekształć dane wiadomości
    const formattedMessages = messages.map(
      (msg: {
        id: string;
        content: string;
        senderId: string;
        sender: {
          id: string;
          firstName: string | null;
          lastName: string | null;
          image: string | null;
        };
        isRead: boolean;
        createdAt: Date;
      }) => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.senderId,
        senderName:
          `${msg.sender.firstName || ''} ${msg.sender.lastName || ''}`.trim() || 'Użytkownik',
        senderImage: msg.sender.image,
        isRead: msg.isRead,
        createdAt: msg.createdAt,
      }),
    );

    const total = await prisma.userMessage.count({
      where: { conversationId },
    });

    // Określ drugiego uczestnika konwersacji
    const otherParticipant =
      conversation.participant1Id === authResult.userId
        ? conversation.participant2
        : conversation.participant1;

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        otherParticipant: {
          id: otherParticipant.id,
          name:
            `${otherParticipant.firstName || ''} ${otherParticipant.lastName || ''}`.trim() ||
            otherParticipant.email,
          email: otherParticipant.email,
          image: otherParticipant.image,
        },
      },
      messages: formattedMessages.reverse(), // Odwróć kolejność, aby najstarsze były na górze
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error, request, { endpoint: 'messages/[conversationId]' });
  }
}

// POST /api/messages/[conversationId] - Wyślij wiadomość do konwersacji
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  try {
    const authResult = await getActiveUser(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const rateLimitResponse = apiRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { conversationId } = await params;
    const body = await request.json();
    const validatedData = sendMessageSchema.parse(body);

    // Sprawdź czy użytkownik ma dostęp do konwersacji
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ participant1Id: authResult.userId }, { participant2Id: authResult.userId }],
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Konwersacja nie istnieje lub brak dostępu' },
        { status: 404 },
      );
    }

    // Utwórz wiadomość
    const message = await prisma.userMessage.create({
      data: {
        conversationId,
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

    // Zaktualizuj czas ostatniej wiadomości w konwersacji
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    return NextResponse.json(
      {
        message: {
          id: message.id,
          content: message.content,
          senderId: message.senderId,
          senderName:
            `${message.sender.firstName || ''} ${message.sender.lastName || ''}`.trim() ||
            'Użytkownik',
          senderImage: message.sender.image,
          createdAt: message.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error, request, { endpoint: 'messages/[conversationId]' });
  }
}
