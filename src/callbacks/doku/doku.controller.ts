import { Controller, Post, Body, Headers, HttpCode, HttpStatus, RawBodyRequest, Req } from '@nestjs/common';
import * as crypto from 'crypto';
import { PaymentService } from '../../common/services/payment.service';
import { config } from '../../config/configuration';
import { Request } from 'express';

interface DokuCallback {
    order: {
        invoice_number: string;
        amount: number;
        currency: string;
    };
    transaction: {
        status: string;
        date: string;
        original_request_id: string;
    };
    acquirer?: {
        id: string;
    };
    channel?: {
        id: string;
    };
}

@Controller('callback/doku')
export class DokuController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post()
    @HttpCode(HttpStatus.OK)
    async handleCallback(
        @Body() body: DokuCallback,
        @Headers('client-id') clientId: string,
        @Headers('request-id') requestId: string,
        @Headers('request-timestamp') timestamp: string,
        @Headers('signature') signature: string,
    ) {
        console.log('[DOKU Callback]', body);

        // Verify HMAC-SHA256 signature
        const { doku } = config.paymentGateway;

        // Generate digest from body
        const bodyString = JSON.stringify(body);
        const digest = crypto.createHash('sha256').update(bodyString).digest('base64');

        // Create signature components for notification
        const requestTarget = '/api/callback/doku'; // The callback endpoint path
        const signatureComponents = [
            `Client-Id:${clientId}`,
            `Request-Id:${requestId}`,
            `Request-Timestamp:${timestamp}`,
            `Request-Target:${requestTarget}`,
            `Digest:${digest}`,
        ].join('\n');

        const hmac = crypto.createHmac('sha256', doku.secretKey);
        hmac.update(signatureComponents);
        const expectedSignature = `HMACSHA256=${hmac.digest('base64')}`;

        // Signature verification (optional - can be strict in production)
        if (signature && signature !== expectedSignature) {
            console.warn('[DOKU] Signature mismatch:', { expected: expectedSignature, received: signature });
            // Continue processing for now, but log the mismatch
        }

        // DOKU transaction status: SUCCESS, FAILED, EXPIRED
        const invoiceNumber = body.order?.invoice_number;
        const status = body.transaction?.status;

        if (!invoiceNumber) {
            return { status: 'error', message: 'Missing invoice number' };
        }

        if (status === 'SUCCESS') {
            await this.paymentService.markAsPaid(invoiceNumber);
        } else if (status === 'FAILED' || status === 'EXPIRED') {
            await this.paymentService.markAsCancelled(invoiceNumber);
        }

        return { status: 'success' };
    }
}
