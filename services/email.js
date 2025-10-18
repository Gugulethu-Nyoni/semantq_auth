// semantq_auth/services/email.js

import loadConfigPromise from '../../../../config_loader.js';
import { Resend } from 'resend';
import mailgunJs from 'mailgun-js';
import nodemailer from 'nodemailer';

// --- Drivers ---
class ResendDriver {
  constructor({ apiKey }) {
    this.resend = new Resend(apiKey);
  }

  async send({ from, to, subject, html, text }) {
    return this.resend.emails.send({ from, to, subject, html, text });
  }
}

class MailgunDriver {
  constructor({ apiKey, domain }) {
    this.mailgun = mailgunJs({ apiKey, domain });
  }

  async send({ from, to, subject, html, text }) {
    return this.mailgun.messages().send({ from, to, subject, html, text });
  }
}

class SMTPDriver {
  constructor(options) {
    this.transporter = nodemailer.createTransport(options);
  }

  async send({ from, to, subject, html, text }) {
    return this.transporter.sendMail({ from, to, subject, html, text });
  }
}

class MockEmailDriver {
  async send(email) {
    console.log('[Mock Email] Would send:', email);
    return { id: 'mock-id' };
  }
}

// --- EmailService ---
export class EmailService {
  static async create() {
    const service = new EmailService();
    await service._initializeDriver();
    return service;
  }

  async _initializeDriver() {
    const config = await loadConfigPromise();
    const emailConfig = config.email || {};
    const driverType = (emailConfig.driver || 'resend').toLowerCase();

    switch (driverType) {
      case 'resend':
        if (!emailConfig.resend_api_key) {
          console.error("[EmailService] Missing resend_api_key in config.email");
          this.driver = new MockEmailDriver();
          break;
        }
        this.driver = new ResendDriver({ apiKey: emailConfig.resend_api_key });
        break;

      case 'mailgun':
        if (!emailConfig.config?.mailgun?.apiKey || !emailConfig.config.mailgun.domain) {
          console.error("[EmailService] Mailgun config not found in config.email.config.mailgun");
          this.driver = new MockEmailDriver();
          break;
        }
        this.driver = new MailgunDriver(emailConfig.config.mailgun);
        break;

      case 'smtp':
        if (!emailConfig.config?.smtp) {
          console.error("[EmailService] SMTP config not found in config.email.config.smtp");
          this.driver = new MockEmailDriver();
          break;
        }
        this.driver = new SMTPDriver(emailConfig.config.smtp);
        break;

      case 'mock':
        this.driver = new MockEmailDriver();
        break;

      default:
        console.warn(`[EmailService] Unknown EMAIL_DRIVER "${driverType}". Using MockEmailDriver.`);
        this.driver = new MockEmailDriver();
    }
  }

  async sendConfirmationEmail({ to, name, token }) {
    if (!this.driver) throw new Error("EmailService not initialized.");

    const config = await loadConfigPromise();
    const { email, brand } = config;

    const confirmationUrl = `${brand.frontend_base_url}/auth/confirm?token=${token}`;
    const subject = `Confirm Your ${brand.name} Account`;

    const html = this._generateConfirmationTemplate({
      name,
      brandName: brand.name,
      supportEmail: brand.support_email,
      confirmationUrl,
      year: new Date().getFullYear(),
    });

    try {
      await this.driver.send({
        from: `${email.email_from_name} <${email.email_from}>`,
        to,
        subject,
        html,
        text: `Hi ${name}, please confirm your email by visiting: ${confirmationUrl}`,
      });
      console.log(`[EmailService] Confirmation email sent to: ${to}`);
    } catch (error) {
      console.error(`[EmailService] Error sending confirmation email to ${to}:`, error);
      throw new Error(`Failed to send confirmation email: ${error.message}`);
    }
  }

  async sendPasswordResetEmail({ to, name, token }) {
    if (!this.driver) throw new Error("EmailService not initialized.");

    const config = await loadConfigPromise();
    const { email, brand } = config;

    const resetUrl = `${brand.frontend_base_url}/auth/reset?token=${token}`;
    const subject = `Reset Your ${brand.name} Password`;

    const html = this._generatePasswordResetTemplate({
      name,
      brandName: brand.name,
      supportEmail: brand.support_email,
      resetUrl,
      year: new Date().getFullYear(),
    });

    try {
      await this.driver.send({
        from: `${email.email_from_name} <${email.email_from}>`,
        to,
        subject,
        html,
        text: `Hi ${name}, you requested a password reset. Please use this link: ${resetUrl}`,
      });
      console.log(`[EmailService] Password reset email sent to: ${to}`);
    } catch (error) {
      console.error(`[EmailService] Error sending reset email to ${to}:`, error);
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  }

  _generateConfirmationTemplate({ name, brandName, supportEmail, confirmationUrl, year }) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button {
      display: inline-block;
      padding: 10px 20px;
      background-color: #007bff;
      color: white !important;
      text-decoration: none;
      border-radius: 4px;
      margin: 15px 0;
    }
    .footer { margin-top: 20px; font-size: 12px; color: #777; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Hi ${name},</h1>
    <p>Welcome to <strong>${brandName}</strong>! We're excited to have you on board.</p>
    <p>To complete your registration, please confirm your email address by clicking the button below:</p>
    <p><a href="${confirmationUrl}" class="button">Confirm Email</a></p>
    <p>Or copy and paste this link into your browser:<br>
      <a href="${confirmationUrl}">${confirmationUrl}</a>
    </p>
    <p>If you didn't create an account with ${brandName}, you can safely ignore this email.</p>
    <div class="footer">
      <p>Need help? Contact our support team at <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>
      <p>&copy; ${year} ${brandName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
  }

  _generatePasswordResetTemplate({ name, brandName, supportEmail, resetUrl, year }) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button {
      display: inline-block;
      padding: 10px 20px;
      background-color: #ffc107;
      color: black !important;
      text-decoration: none;
      border-radius: 4px;
      margin: 15px 0;
    }
    .footer { margin-top: 20px; font-size: 12px; color: #777; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Hi ${name},</h1>
    <p>You recently requested to reset your password for your <strong>${brandName}</strong> account.</p>
    <p>To complete the password reset process, please click the button below:</p>
    <p><a href="${resetUrl}" class="button">Reset Password</a></p>
    <p>Or copy and paste this link into your browser:<br>
      <a href="${resetUrl}">${resetUrl}</a>
    </p>
    <p>If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
    <div class="footer">
      <p>Need help? Contact our support team at <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>
      <p>&copy; ${year} ${brandName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
  }
}

export const emailServicePromise = EmailService.create();
