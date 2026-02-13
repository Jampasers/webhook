import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import * as crypto from 'crypto';
import { PaymentService } from '../../common/services/payment.service';
import { config } from '../../config/configuration';

interface DuitkuCallback {
    merchantCode: string;
    amount: string;
    merchantOrderId: string;
    productDetail: string;
    paymentCode: string;
    resultCode: string;
    merchantUserId: string;
    reference: string;
    signature: string;
    publisherOrderId: string;
    spUserHash: string;
    settlementDate: string;
    issuerCode: string;
}

@Controller('callback/duitku')
export class DuitkuController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post()
    @HttpCode(HttpStatus.OK)
    async handleCallback(@Body() body: DuitkuCallback) {
        console.log('[Duitku Callback]', body);

        // Verify signature: MD5(merchantCode + amount + merchantOrderId + apiKey)
        const { duitku } = config.paymentGateway;
        const expectedSignature = crypto
            .createHash('md5')
            .update(duitku.merchantCode + body.amount + body.merchantOrderId + duitku.apiKey)
            .digest('hex');

        if (body.signature !== expectedSignature) {
            console.error('[Duitku] Invalid signature');
            return { status: 'error', message: 'Invalid signature' };
        }

        // Duitku result codes: 00 = success, 01 = pending, 02 = cancelled
        if (body.resultCode === '00') {
            await this.paymentService.markAsPaid(body.merchantOrderId);
        } else if (body.resultCode === '02') {
            await this.paymentService.markAsCancelled(body.merchantOrderId);
        }

        return { status: 'success' };
    }
}
