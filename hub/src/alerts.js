import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendAlertEmail(subject, text) {
    if (!process.env.SMTP_HOST || !process.env.ALERT_EMAIL) {
        console.log('SMTP not configured, skipping email alert.');
        return;
    }

    try {
        await transporter.sendMail({
            from: `"Uptix Alerts" <${process.env.SMTP_USER}>`,
            to: process.env.ALERT_EMAIL,
            subject: `[Uptix Alert] ${subject}`,
            text: text,
        });
        console.log(`Alert email sent: ${subject}`);
    } catch (error) {
        console.error('Failed to send alert email:', error);
    }
}
