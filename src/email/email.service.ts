import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    const host = this.configService.get('SMTP_HOST');
    const port = this.configService.get('SMTP_PORT');
    const user = this.configService.get('SMTP_USER');
    const pass = this.configService.get('SMTP_PASS');

    if (host && port) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(port, 10),
        secure: port === '465',
        auth: user && pass ? { user, pass } : undefined,
      });
      this.logger.log('Email transporter configured');
    } else {
      this.logger.warn('SMTP not configured. Emails will be logged to console.');
    }
  }

  private async sendMail(to: string, subject: string, html: string) {
    const from = this.configService.get('SMTP_FROM') || 'noreply@taskmanager.com';

    if (!this.transporter) {
      this.logger.log(`[Email Mock] To: ${to}, Subject: ${subject}`);
      this.logger.log(`[Email Mock] Body: ${html}`);
      return;
    }

    try {
      await this.transporter.sendMail({ from, to, subject, html });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string, token: string, userName: string) {
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password/${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a1a;">${userName}様</h2>
        <p>パスワードリセットのリクエストを受け付けました。</p>
        <p>以下のリンクをクリックして、新しいパスワードを設定してください：</p>
        <p style="margin: 30px 0;">
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
            パスワードをリセット
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">このリンクは1時間で期限切れになります。</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          このメールに心当たりがない場合は、無視してください。<br>
          あなたのアカウントは安全です。
        </p>
      </body>
      </html>
    `;

    await this.sendMail(email, 'パスワードリセットのご案内', html);
  }

  async sendProjectInvitationEmail(
    email: string,
    projectName: string,
    inviterName: string,
    token: string,
    isNewUser: boolean,
  ) {
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const actionUrl = isNewUser
      ? `${frontendUrl}/register?invitation=${token}`
      : `${frontendUrl}/invitations`;

    const buttonText = isNewUser ? 'アカウントを作成して参加' : '招待を確認';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a1a;">プロジェクトへの招待</h2>
        <p><strong>${inviterName}</strong>さんがあなたをプロジェクト「<strong>${projectName}</strong>」に招待しました。</p>
        <p style="margin: 30px 0;">
          <a href="${actionUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
            ${buttonText}
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">この招待は7日間有効です。</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          このメールに心当たりがない場合は、無視してください。
        </p>
      </body>
      </html>
    `;

    await this.sendMail(email, `${inviterName}さんからプロジェクト「${projectName}」への招待`, html);
  }
}
