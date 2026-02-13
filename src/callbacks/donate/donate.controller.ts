import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { PaymentService } from '../../common/services/payment.service';

interface DonateCallback {
    growId: string;
    amount: number;
}

@Controller('callback/donate')
export class DonateController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post()
    @HttpCode(HttpStatus.OK)
    async handleDonate(
        @Body() body: DonateCallback,
    ) {
        console.log('[Donate Callback]', body);

        const success = await this.paymentService.logDonation(body.growId, body.amount);

        if (success) {
            return { status: 'success', message: 'Balance updated' };
        } else {
            return { status: 'error', message: 'User or rate not found' };
        }
    }
}
