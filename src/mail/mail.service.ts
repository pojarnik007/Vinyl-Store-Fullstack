import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { User } from '../users/entities/user.entity';
import { VinylRecord } from '../vinyl/entities/vinyl.entity';
import { Order } from '../orders/entities/order.entity';

@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: configService.get<string>('smtp.host'),
      port: configService.get<number>('smtp.port'),
      secure: configService.get<number>('smtp.port') === 465,
      auth: {
        user: configService.get<string>('smtp.user'),
        pass: configService.get<string>('smtp.pass'),
      },
      debug: true,
      logger: true,
    });
  }

  async sendPaymentConfirmation(user: User, vinyl: VinylRecord, order: Order): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('smtp.from'),
        to: user.email,
        subject: `Payment Confirmed — ${vinyl.name}`,
        html: this.buildPaymentConfirmationHtml(user, vinyl, order),
      });
      this.logger.log(`Payment confirmation email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${user.email}: ${error.message}`);
    }
  }

  private buildPaymentConfirmationHtml(user: User, vinyl: VinylRecord, order: Order): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
          .header { background: #1a1a2e; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; }
          .order-card { background: #f5f5f5; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .price { font-size: 24px; color: #e94560; font-weight: bold; }
          .footer { text-align: center; color: #888; font-size: 12px; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Vinyl Store</h1>
        </div>
        <div class="content">
          <h2>Hello, ${user.firstName || 'Music Lover'}!</h2>
          <p>Your payment has been confirmed. Thank you for your purchase!</p>

          <div class="order-card">
            ${vinyl.image ? `<img src="${vinyl.image}" alt="${vinyl.name}" style="max-width: 200px; border-radius: 4px;">` : ''}
            <h3>${vinyl.name}</h3>
            <p>by <strong>${vinyl.authorName}</strong></p>
            <p class="price">$${Number(order.amount).toFixed(2)}</p>
            <p><small>Order ID: ${order.id}</small></p>
            <p><small>Date: ${new Date(order.createdAt).toLocaleDateString()}</small></p>
          </div>

          <p>Enjoy your vinyl!</p>
        </div>
        <div class="footer">
          <p>© 2024 Vinyl Store. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
  }
}
