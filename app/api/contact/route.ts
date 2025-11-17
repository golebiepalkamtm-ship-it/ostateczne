import { handleApiError } from '@/lib/error-handling';
import { apiRateLimit } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { z } from 'zod';

const contactSchema = z.object({
  fullName: z.string().min(2, 'Imię i nazwisko musi mieć co najmniej 2 znaki'),
  email: z.string().email('Nieprawidłowy adres email'),
  subject: z.string().min(3, 'Temat musi mieć co najmniej 3 znaki'),
  message: z.string().min(10, 'Wiadomość musi mieć co najmniej 10 znaków'),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = apiRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    const validatedData = contactSchema.parse(body);

    // Konfiguracja transportera Nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: parseInt(process.env.EMAIL_SERVER_PORT || '587', 10),
      secure: process.env.EMAIL_SERVER_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    // Formatowanie wiadomości
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Nowa wiadomość z formularza kontaktowego</h2>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Od:</strong> ${validatedData.fullName}</p>
          <p><strong>Email:</strong> ${validatedData.email}</p>
          <p><strong>Temat:</strong> ${validatedData.subject}</p>
        </div>
        <div style="background-color: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h3 style="color: #333; margin-top: 0;">Wiadomość:</h3>
          <p style="white-space: pre-wrap; line-height: 1.6;">${validatedData.message}</p>
        </div>
      </div>
    `;

    const emailText = `
Nowa wiadomość z formularza kontaktowego

Od: ${validatedData.fullName}
Email: ${validatedData.email}
Temat: ${validatedData.subject}

Wiadomość:
${validatedData.message}
    `;

    // Opcje emaila
    const mailOptions = {
      from: `"Formularz Kontaktowy" <${process.env.EMAIL_FROM}>`,
      to: process.env.CONTACT_EMAIL || process.env.EMAIL_FROM,
      replyTo: validatedData.email,
      subject: `[Formularz Kontaktowy] ${validatedData.subject}`,
      html: emailHtml,
      text: emailText,
    };

    // Wysłanie emaila
    await transporter.sendMail(mailOptions);

    console.log('✅ Email kontaktowy wysłany pomyślnie od:', validatedData.email);
    return NextResponse.json({ success: true, message: 'Wiadomość została wysłana pomyślnie' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Błąd walidacji danych',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }
    return handleApiError(error, request, { endpoint: 'contact' });
  }
}

