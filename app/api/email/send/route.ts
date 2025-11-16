import { handleApiError } from '@/lib/error-handling';
import {
  generateEmailVerificationTemplate,
  generateEmailVerificationTextTemplate,
} from '@/lib/email-templates';
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, html, text, userName, verificationLink, type } = body;

    // Jeśli to email weryfikacyjny, użyj profesjonalnego szablonu
    let emailHtml = html;
    let emailText = text;

    if (type === 'verification' && verificationLink) {
      const logoUrl = `${request.nextUrl.origin}/logo.png`;
      emailHtml = generateEmailVerificationTemplate({
        verificationLink,
        userName,
        logoUrl,
      });
      emailText = generateEmailVerificationTextTemplate({
        verificationLink,
        userName,
      });
    }

    if (!to || !subject || (!emailHtml && !emailText)) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, and html or text' },
        { status: 400 }
      );
    }

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

    // Opcje emaila
    const mailOptions = {
      from: `"Pałka MTM - Mistrzowie Sprintu" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html: emailHtml,
      text: emailText,
    };

    // Wysłanie emaila
    await transporter.sendMail(mailOptions);

    console.log('✅ Email wysłany pomyślnie do:', to);
    return NextResponse.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    return handleApiError(error, request, { endpoint: 'email/send' });
  }
}
