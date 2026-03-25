import * as common from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { StripeService } from './stripe.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { User } from '../users/entities/user.entity';
import { BadRequestException } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';

@ApiTags('payments')
@common.Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly stripeService: StripeService,
  ) {}

  @common.Post('initiate')
  @common.UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Получить clientSecret' })
  initiatePayment(@CurrentUser() user: User, @common.Body() dto: CreatePaymentDto) {
    return this.paymentsService.initiatePayment(user.id, dto.vinylId, user);
  }

  @common.Post('webhook')
  @Public()
  @common.HttpCode(common.HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook' })
  async handleWebhook(
    @common.Req() req: common.RawBodyRequest<Request>,
    @common.Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody) {
      throw new BadRequestException('No raw body');
    }
    if (!signature) throw new common.BadRequestException('Missing stripe-signature header');

    const event = this.stripeService.constructWebhookEvent(req.rawBody, signature);
    await this.paymentsService.handleWebhook(event);
    return { received: true };
  }
}
