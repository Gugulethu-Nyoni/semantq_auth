// semantq_auth/services/email.js

// --- IMPORTANT CHANGE HERE ---
// Import the config loader module
import loadConfigPromise from '../../../../config_loader.js';
// --- END IMPORTANT CHANGE ---

import { Resend } from 'resend';
import mailgunJs from 'mailgun-js'; // Note: mailgun-js might be deprecated for newer SDKs.
import nodemailer from 'nodemailer';

// --- Driver Implementations remain unchanged ---
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

// --- EmailService Class ---
export class EmailService {
  // We need to make the constructor async or use an async IIFE
  // because we need to await the configPromise.
  // A common pattern is to have an async factory function or
  // initialize the driver after the config is loaded.
  // For simplicity and to match the existing structure, we'll
  // make the _initDriver an async method and call it from an async context.

  constructor() {
    // This constructor will now return a promise, which means
    // you'll need to await new EmailService() wherever it's used.
    // Alternatively, we can make _initDriver a static async method
    // and call it once. Let's adjust for the latter, which is cleaner.
  }

  // Static async method to create and initialize the EmailService instance
  static async create() {
    const service = new EmailService();
    await service._initializeDriver(); // Call the async initialization
    return service;
  }

  async _initializeDriver() {
    // Await the loaded configuration here
    const config = await loadConfigPromise;

    // Access the email configuration from the loaded config
    // Assuming your semantq.config.js has an 'email' section
    const emailConfig = config.email;

    const driverType = process.env.EMAIL_DRIVER?.toLowerCase();

    switch (driverType) {
      case 'resend':
        if (!emailConfig || !emailConfig.config || !emailConfig.config.resend || !emailConfig.config.resend.apiKey) {
            console.error("[EmailService] Resend API Key not found in config.email.config.resend.apiKey or environment.");
            this.driver = new MockEmailDriver(); // Fallback to mock on missing config
            break;
        }
        this.driver = new ResendDriver(emailConfig.config.resend);
        break;
      case 'mailgun':
        if (!emailConfig || !emailConfig.config || !emailConfig.config.mailgun || !emailConfig.config.mailgun.apiKey || !emailConfig.config.mailgun.domain) {
            console.error("[EmailService] Mailgun config (apiKey/domain) not found in config.email.config.mailgun or environment.");
            this.driver = new MockEmailDriver(); // Fallback to mock on missing config
            break;
        }
        this.driver = new MailgunDriver(emailConfig.config.mailgun);
        break;
      case 'smtp':
        if (!emailConfig || !emailConfig.config || !emailConfig.config.smtp) {
            console.error("[EmailService] SMTP config not found in config.email.config.smtp or environment.");
            this.driver = new MockEmailDriver(); // Fallback to mock on missing config
            break;
        }
        this.driver = new SMTPDriver(emailConfig.config.smtp);
        break;
      case 'mock':
        this.driver = new MockEmailDriver();
        break;
      default:
        console.warn(`[EmailService] Unsupported or missing EMAIL_DRIVER: "${driverType}". Falling back to MockEmailDriver.`);
        this.driver = new MockEmailDriver();
        break;
    }
    if (!this.driver) { // Fallback if no driver was set
        console.warn("[EmailService] No email driver could be initialized. Defaulting to MockEmailDriver.");
        this.driver = new MockEmailDriver();
    }
  }

  // Existing: Send Confirmation Email
  async sendConfirmationEmail({ to, name, token }) {
    if (!this.driver) {
        throw new Error("EmailService driver not initialized. Call EmailService.create() first.");
    }
    const confirmationUrl = `${process.env.UI_BASE_URL}/confirm-email?token=${token}`;
    const subject = `Confirm Your ${process.env.BRAND_NAME} Account`;

    const html = this._generateConfirmationTemplate({
      name,
      brandName: process.env.BRAND_NAME,
      supportEmail: process.env.BRAND_SUPPORT_EMAIL,
      confirmationUrl,
      year: new Date().getFullYear(),
    });

    try {
      await this.driver.send({
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
        to,
        subject,
        html,
        text: `Hi ${name}, please confirm your email by visiting: ${confirmationUrl}`,
      });
      console.log(`[EmailService] Confirmation email sent to: ${to}`);
    } catch (error) {
      console.error(`[EmailService] Failed to send confirmation email to ${to}:`, error);
      throw new Error(`Failed to send confirmation email: ${error.message}`);
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

        <p>
          <a href="${confirmationUrl}" class="button">Confirm Email</a>
        </p>

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

  async sendPasswordResetEmail({ to, name, token }) {
    if (!this.driver) {
        throw new Error("EmailService driver not initialized. Call EmailService.create() first.");
    }
    const resetUrl = `${process.env.UI_BASE_URL}/reset-password?token=${token}`;
    const subject = `Reset Your ${process.env.BRAND_NAME} Password`;

    const html = this._generatePasswordResetTemplate({
      name,
      brandName: process.env.BRAND_NAME,
      supportEmail: process.env.BRAND_SUPPORT_EMAIL,
      resetUrl,
      year: new Date().getFullYear(),
    });

    try {
      await this.driver.send({
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
        to,
        subject,
        html,
        text: `Hi ${name}, you requested a password reset. Please use this link: ${resetUrl}`,
      });
      console.log(`[EmailService] Password reset email sent to: ${to}`);
    } catch (error) {
      console.error(`[EmailService] Failed to send password reset email to ${to}:`, error);
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
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
          background-color: #ffc107; /* A distinct color for reset button */
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

        <p>
          <a href="${resetUrl}" class="button">Reset Password</a>
        </p>

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

// Export a factory function or an initialized promise
// The old `export const emailService = new EmailService();` won't work directly
// because the constructor needs to be async or called from an async context.
// We'll export a promise that resolves to the initialized service.
export const emailServicePromise = EmailService.create();