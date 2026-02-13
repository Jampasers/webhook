import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import * as crypto from 'crypto';
import { PaymentService } from '../../common/services/payment.service';
import { config } from '../../config/configuration';

interface TokopayCallback {
    trx_id: string;
    merchant_ref: string;
    status: string;
    amount: number;
    signature: string;
}

@Controller('callback/tokopay')
export class TokopayController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post()
    @HttpCode(HttpStatus.OK)
    async handleCallback(@Body() body: TokopayCallback) {
        console.log('[Tokopay Callback]', body);

        // Verify signature: MD5(merchant_id + secret + merchant_ref)
        const { tokopay } = config.paymentGateway;
        const expectedSignature = crypto
            .createHash('md5')
            .update(tokopay.merchantId + tokopay.secret + body.merchant_ref)
            .digest('hex');

        if (body.signature !== expectedSignature) {
            console.error('[Tokopay] Invalid signature');
            return { status: 'error', message: 'Invalid signature' };
        }

        // Update payment status
        if (body.status === 'Success' || body.status === 'Paid') {
            await this.paymentService.markAsPaid(body.merchant_ref);
        } else if (body.status === 'Failed' || body.status === 'Expired') {
            await this.paymentService.markAsCancelled(body.merchant_ref);
        }

        return { status: 'success' };
    }
}
