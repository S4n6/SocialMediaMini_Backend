// src/modules/mailer/mailer.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import {
  SendEmailDto,
  SendWelcomeEmailDto,
  SendPasswordResetDto,
  SendFriendRequestDto,
} from './dto/sendMail.dto';
import { CreateMailerDto } from './dto/createMailer.dto';
import { BACK_URL } from 'src/constants/backUrl.constant';

@Injectable()
export class MailerService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailerService.name);

  constructor(private configService: ConfigService) {
    this.createTransporter();
  }

  private createTransporter() {
    const mailConfig = this.configService.get('mail');

    this.transporter = nodemailer.createTransport({
      host: mailConfig.host,
      port: mailConfig.port,
      secure: mailConfig.secure,
      auth: {
        user: mailConfig.auth.user,
        pass: mailConfig.auth.pass,
      },
      tls: mailConfig.tls,
    });

    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error('Email transporter verification failed:', error);
      } else {
        this.logger.log('Email transporter is ready to send emails');
      }
    });
  }

  async sendEmail(createMailerDto: CreateMailerDto) {
    try {
      const mailConfig = this.configService.get('mail');

      const mailOptions = {
        from:
          createMailerDto.from ||
          `${mailConfig.from.name} <${mailConfig.from.email}>`,
        to: createMailerDto.to,
        subject: createMailerDto.subject,
        text: createMailerDto.text,
        html: createMailerDto.html,
        cc: createMailerDto.cc,
        bcc: createMailerDto.bcc,
        attachments: createMailerDto.attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);

      this.logger.log(`Email sent successfully to ${createMailerDto.to}`);
      return {
        success: true,
        messageId: result.messageId,
        message: 'Email sent successfully',
      };
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${createMailerDto.to}:`,
        error,
      );
      throw error;
    }
  }

  async sendSimpleEmail(sendEmailDto: SendEmailDto) {
    return this.sendEmail({
      to: sendEmailDto.to,
      subject: sendEmailDto.subject,
      text: sendEmailDto.text,
      html: sendEmailDto.html,
    });
  }

  async sendWelcomeEmail(welcomeEmailDto: SendWelcomeEmailDto) {
    const { email, username, fullname } = welcomeEmailDto;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .button { background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Social Media Mini! 🎉</h1>
            </div>
            <div class="content">
              <h2>Hello ${fullname}!</h2>
              <p>Welcome to our social media platform! We're excited to have you join our community.</p>
              <p>Your username: <strong>@${username}</strong></p>
              <p>You can now:</p>
              <ul>
                <li>Create and share posts</li>
                <li>Connect with friends</li>
                <li>Join conversations</li>
                <li>Discover new content</li>
              </ul>
              <a href="${BACK_URL.FRONT_END_WEB}/login" class="button" style="color:white">Get Started</a>
            </div>
            <div class="footer">
              <p>Thanks for joining Social Media Mini!</p>
              <p>If you have any questions, feel free to contact us.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Welcome to Social Media Mini! 🎉',
      html,
      text: `Welcome to Social Media Mini, ${fullname}! Your username is @${username}. Start connecting with friends and sharing your moments.`,
    });
  }

  async sendPasswordResetEmail(passwordResetDto: SendPasswordResetDto) {
    const { email, resetToken, username } = passwordResetDto;
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background-color: #DC2626; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .button { background-color: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
            .warning { background-color: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request 🔒</h1>
            </div>
            <div class="content">
              <h2>Hello @${username}!</h2>
              <p>We received a request to reset your password for your Social Media Mini account.</p>
              <p>Click the button below to reset your password:</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul>
                  <li>This link will expire in 1 hour</li>
                  <li>If you didn't request this reset, please ignore this email</li>
                  <li>Never share this link with anyone</li>
                </ul>
              </div>
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            </div>
            <div class="footer">
              <p>This is an automated email from Social Media Mini.</p>
              <p>If you need help, contact our support team.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Reset Your Password - Social Media Mini',
      html,
      text: `Password reset requested for @${username}. Reset link: ${resetUrl} (expires in 1 hour)`,
    });
  }

  async sendFriendRequestEmail(friendRequestDto: SendFriendRequestDto) {
    const { to, senderName, senderUsername, receiverName } = friendRequestDto;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background-color: #10B981; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .button { background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Friend Request! 👋</h1>
            </div>
            <div class="content">
              <h2>Hello ${receiverName}!</h2>
              <p><strong>${senderName}</strong> (@${senderUsername}) sent you a friend request on Social Media Mini!</p>
              <p>Connect with them to see their posts and stay in touch.</p>
              <a href="${process.env.FRONTEND_URL}/friends/requests" class="button">View Friend Requests</a>
            </div>
            <div class="footer">
              <p>Social Media Mini - Connecting People</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: `${senderName} sent you a friend request!`,
      html,
      text: `${senderName} (@${senderUsername}) sent you a friend request on Social Media Mini! Check your notifications to respond.`,
    });
  }

  async sendEmailVerification(
    email: string,
    username: string,
    verificationToken: string,
  ) {
    const verificationUrl = `${BACK_URL.BACK_END_API}/auth/verify-email/${verificationToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background-color: #7C3AED; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .button { background-color: #7C3AED; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Verify Your Email ✉️</h1>
            </div>
            <div class="content">
              <h2>Hello @${username}!</h2>
              <p>Please verify your email address to complete your Social Media Mini registration.</p>
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
              <p>If the button doesn't work, copy and paste this link:</p>
              <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
              <p><em>This verification link will expire in 24 hours.</em></p>
            </div>
            <div class="footer">
              <p>Welcome to Social Media Mini!</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Verify Your Email - Social Media Mini',
      html,
      text: `Please verify your email for Social Media Mini: ${verificationUrl}`,
    });
  }

  async sendBulkEmails(emails: CreateMailerDto[]) {
    const results: Array<
      | {
          email: string;
          success: true;
          result: { success: boolean; messageId: any; message: string };
        }
      | { email: string; success: false; error: string }
    > = [];

    for (const emailData of emails) {
      try {
        const result = await this.sendEmail(emailData);
        results.push({ email: emailData.to, success: true, result });

        // Add delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        results.push({
          email: emailData.to,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  async testConnection() {
    try {
      await this.transporter.verify();
      return { success: true, message: 'Email service is working correctly' };
    } catch (error) {
      this.logger.error('Email connection test failed:', error);
      return {
        success: false,
        message: 'Email service connection failed',
        error: error.message,
      };
    }
  }
}
