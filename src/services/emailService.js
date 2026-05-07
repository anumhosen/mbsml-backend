// src/services/emailService.js
const { Resend } = require('resend');
const dotenv = require('dotenv');

dotenv.config();
// Initialize Resend with your API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

// The sender email address must be a verified domain in Resend
const FROM_EMAIL = process.env.EMAIL_FROM || 'onboarding@resend.dev';

/**
 * Sends an email verification link to the user.
 * @param {string} to - Recipient email address.
 * @param {string} token - Email verification token.
 * @returns {Promise<void>}
 */
exports.sendVerificationEmail = async (to, token) => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: 'Verify Your Email Address',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><title>Email Verification</title></head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to MBSML Lab!</h2>
          <p>Please verify your email address by clicking the link below:</p>
          <p><a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a></p>
          <p>Or copy and paste this link into your browser:</p>
          <p>${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>Best regards,<br>MBSML Lab Team</p>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending verification email:', error);
      throw new Error('Failed to send verification email');
    }

    console.log(`Verification email sent to ${to} (ID: ${data?.id})`);
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw new Error('Email service unavailable');
  }
};

/**
 * Sends a password reset link to the user.
 * @param {string} to - Recipient email address.
 * @param {string} token - Password reset token.
 * @returns {Promise<void>}
 */
exports.sendPasswordResetEmail = async (to, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: 'Reset Your Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><title>Password Reset</title></head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>We received a request to reset your password. Click the link below to create a new password:</p>
          <p><a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
          <p>Or copy and paste this link into your browser:</p>
          <p>${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br>MBSML Lab Team</p>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }

    console.log(`Password reset email sent to ${to} (ID: ${data?.id})`);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw new Error('Email service unavailable');
  }
};
