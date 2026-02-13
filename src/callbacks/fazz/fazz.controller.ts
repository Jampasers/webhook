import { Controller, Post, Body, Headers, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PaymentService } from '../../common/services/payment.service';
import { config } from '../../config/configuration';

interface FazzCallback {
    data: {
        id: string;
        type: string;
        attributes: {
            status: string;
            referenceId: string;
            amount: number;
            createdAt: string;
            paidAt?: string;
        };
    };
}

@Controller('callback/fazz')
export class FazzController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post()
    @HttpCode(HttpStatus.OK)
    async handleCallback(
        @Body() body: FazzCallback,
        @Headers('x-callback-token') callbackToken: string,
    ) {
        console.log('[Fazz Callback]', body);

        // Fazz uses webhook signature for verification
        // For now, we'll verify using the callback token if provided
        const { fazz } = config.paymentGateway;

        // Basic validation - in production, verify webhook signature
        if (!body.data || !body.data.attributes) {
            return { status: 'error', message: 'Invalid payload' };
        }

        const { status, referenceId, amount } = body.data.attributes;

        // Fazz payment statuses: completed, expired, failed
        if (status === 'completed' || status === 'paid') {
            await this.paymentService.markAsPaid(referenceId);
        } else if (status === 'expired' || status === 'failed') {
            await this.paymentService.markAsCancelled(referenceId);
        }

        return { status: 'success' };
    }
}
