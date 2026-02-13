import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import * as crypto from 'crypto';
import { PaymentService } from '../../common/services/payment.service';
import { config } from '../../config/configuration';

interface MidtransCallback {
    transaction_time: string;
    transaction_status: string;
    transaction_id: string;
    status_message: string;
    status_code: string;
    signature_key: string;
    payment_type: string;
    order_id: string;
    merchant_id: string;
    gross_amount: string;
    fraud_status: string;
    currency: string;
}

@Controller('callback/midtrans')
export class MidtransController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post()
    @HttpCode(HttpStatus.OK)
    async handleCallback(@Body() body: MidtransCallback) {
        console.log('[Midtrans Callback]', body);

        // Verify signature: SHA512(order_id + status_code + gross_amount + serverKey)
        const { midtrans } = config.paymentGateway;
        const signatureString =
            body.order_id + body.status_code + body.gross_amount + midtrans.serverKey;
        const expectedSignature = crypto
            .createHash('sha512')
            .update(signatureString)
            .digest('hex');

        if (body.signature_key !== expectedSignature) {
            console.error('[Midtrans] Invalid signature');
            return { status: 'error', message: 'Invalid signature' };
        }

        // Midtrans transaction statuses
        // settlement = success, capture (credit card) = success
        // pending = waiting, deny/cancel/expire = failed
        const successStatuses = ['settlement', 'capture'];
        const failedStatuses = ['deny', 'cancel', 'expire', 'failure'];

        if (successStatuses.includes(body.transaction_status)) {
            await this.paymentService.markAsPaid(body.order_id);
        } else if (failedStatuses.includes(body.transaction_status)) {
            await this.paymentService.markAsCancelled(body.order_id);
        }

        return { status: 'success' };
    }
}
