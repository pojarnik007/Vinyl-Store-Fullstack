import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { VinylRecord } from '../vinyl/entities/vinyl.entity';
import { User } from '../users/entities/user.entity';
import { StripeService } from './stripe.service';
import { MailService } from '../mail/mail.service';
import { LogsService } from '../logs/logs.service';
import { LogAction, LogEntity } from '../logs/entities/system-log.entity';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(VinylRecord)
    private readonly vinylRepository: Repository<VinylRecord>,
    private readonly stripeService: StripeService,
    private readonly mailService: MailService,
    private readonly logsService: LogsService,
  ) {}

  async initiatePayment(userId: string, vinylId: string, _user: User) {
    const vinyl = await this.vinylRepository.findOne({ where: { id: vinylId } });
    if (!vinyl) throw new NotFoundException(`Vinyl #${vinylId} not found`);

    const existing = await this.ordersRepository.findOne({
      where: {
        user: { id: userId },
        vinyl: { id: vinylId },
        status: OrderStatus.COMPLETED,
      },
    });
    if (existing) throw new BadRequestException('You have already purchased this vinyl record');

    const paymentIntent = await this.stripeService.createPaymentIntent(Number(vinyl.price), 'usd', {
      userId,
      vinylId,
      vinylName: vinyl.name,
    });

    const order = this.ordersRepository.create({
      user: { id: userId },
      vinyl: { id: vinylId },
      amount: vinyl.price,
      stripePaymentIntentId: paymentIntent.id,
      status: OrderStatus.PENDING,
    });
    await this.ordersRepository.save(order);

    this.logsService.log(LogAction.CREATE, LogEntity.ORDER, order.id, userId, {
      vinylId,
      amount: vinyl.price,
      stripeId: paymentIntent.id,
    });

    return {
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
      amount: vinyl.price,
      vinylName: vinyl.name,
    };
  }

  async handleWebhook(event: Stripe.Event): Promise<void> {
    this.logger.log(`Processing Stripe event: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const order = await this.ordersRepository.findOne({
      where: { stripePaymentIntentId: paymentIntent.id },
      relations: ['user', 'vinyl'],
    });

    if (!order) {
      this.logger.error(`Order not found for payment intent: ${paymentIntent.id}`);
      return;
    }

    order.status = OrderStatus.COMPLETED;
    await this.ordersRepository.save(order);
    this.logsService.log(LogAction.UPDATE, LogEntity.ORDER, order.id, order.user.id, {
      status: OrderStatus.COMPLETED,
      stripeId: paymentIntent.id,
    });

    await this.mailService.sendPaymentConfirmation(order.user, order.vinyl, order);

    this.logger.log(`Order ${order.id} completed successfully`);
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const order = await this.ordersRepository.findOne({
      where: { stripePaymentIntentId: paymentIntent.id },
      relations: ['user'],
    });

    if (order) {
      order.status = OrderStatus.FAILED;
      await this.ordersRepository.save(order);

      this.logsService.log(LogAction.UPDATE, LogEntity.ORDER, order.id, order.user.id, {
        status: OrderStatus.FAILED,
        error: paymentIntent.last_payment_error?.message,
      });
    }

    this.logger.warn(`Payment failed for intent: ${paymentIntent.id}`);
  }
}
