import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import * as crypto from 'crypto';
import { PaymentService } from '../../common/services/payment.service';
import { config } from '../../config/configuration';

interface TripayCallback {
    reference: string;
    merchant_ref: string;
    payment_method: string;
    payment_method_code: string;
    total_amount: number;
    fee_merchant: number;
    fee_customer: number;
    total_fee: number;
    amount_received: number;
    is_closed_payment: number;
    status: string;
    paid_at: string;
    note: string;
    signature: string;
}

@Controller('callback/tripay')
export class TripayController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post()
    @HttpCode(HttpStatus.OK)
    async handleCallback(@Body() body: TripayCallback) {
        console.log('[Tripay Callback]', body);

        // Verify signature: HMAC-SHA256(merchantCode + merchant_ref + amount)
        const { tripay } = config.paymentGateway;
        const signatureString = tripay.merchantCode + body.merchant_ref + body.total_amount.toString();
        const expectedSignature = crypto
            .createHmac('sha256', tripay.privateKey)
            .update(signatureString)
            .digest('hex');

        if (body.signature !== expectedSignature) {
            console.error('[Tripay] Invalid signature');
            return { success: false, message: 'Invalid signature' };
        }

        // Update payment status
        if (body.status === 'PAID') {
            await this.paymentService.markAsPaid(body.merchant_ref);
        } else if (body.status === 'EXPIRED' || body.status === 'FAILED') {
            await this.paymentService.markAsCancelled(body.merchant_ref);
        }

        return { success: true };
    }
}
