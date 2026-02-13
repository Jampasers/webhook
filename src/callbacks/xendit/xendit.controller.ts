import { Controller, Post, Body, Headers, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { PaymentService } from '../../common/services/payment.service';
import { config } from '../../config/configuration';

interface XenditCallback {
    id: string;
    external_id: string;
    qr_id: string;
    type: string;
    amount: number;
    status: string;
    currency: string;
    created: string;
    updated: string;
    callback_url: string;
}

@Controller('callback/xendit')
export class XenditController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post()
    @HttpCode(HttpStatus.OK)
    async handleCallback(
        @Body() body: XenditCallback,
        @Headers('x-callback-token') callbackToken: string,
    ) {
        console.log('[Xendit Callback]', body);

        // Verify X-Callback-Token header
        const { xendit } = config.paymentGateway;
        if (callbackToken !== xendit.callbackToken) {
            console.error('[Xendit] Invalid callback token');
            throw new UnauthorizedException('Invalid callback token');
        }

        // Xendit QR status: ACTIVE, COMPLETED (paid), EXPIRED
        if (body.status === 'COMPLETED') {
            await this.paymentService.markAsPaid(body.external_id);
        } else if (body.status === 'EXPIRED') {
            await this.paymentService.markAsCancelled(body.external_id);
        }

        return { status: 'success' };
    }
}
