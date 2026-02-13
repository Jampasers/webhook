import { Controller, Post, Body, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { PaymentService } from '../../common/services/payment.service';
import { config } from '../../config/configuration';
import axios from 'axios';

interface PakasirCallback {
    transaction: {
        amount: number;
        order_id: string;
        project: string;
        status: string;
        payment_method: string;
        completed_at: string;
    }
}

@Controller('callback/pakasir')
export class PakasirController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post()
    @HttpCode(HttpStatus.OK)
    async handleCallback(@Body() body: PakasirCallback) {
        console.log('[Pakasir Callback]', body);
        const transaction = body.transaction;

        const { pakasir } = config.paymentGateway;
        console.log({ pakasir })

        // Verify Project matches config
        if (pakasir.projectSlug && transaction.project !== pakasir.projectSlug) {
            console.error(`[Pakasir] Invalid Project Slug: ${transaction.project}`);
            throw new UnauthorizedException('Invalid Project');
        }

        // Verify Transaction via API
        try {
            const verifyUrl = `https://app.pakasir.com/api/transactiondetail?project=${pakasir.projectSlug}&amount=${transaction.amount}&order_id=${transaction.order_id}&api_key=${pakasir.apiKey}`;
            const response = await axios.get(verifyUrl);
            const data = response.data;

            if (!data.transaction) {
                console.error('[Pakasir] Verification failed: Transaction not found');
                throw new UnauthorizedException('Transaction not found');
            }

            const status = data.transaction.status;
            if (status !== 'completed' && status !== 'success' && status !== 'paid') {
                console.error(`[Pakasir] Verification failed: Status is ${status}`);
                // If status is failed/expired, we can mark as cancelled, but let's stick to positive verification for now
                if (status === 'failed' || status === 'expired') {
                    await this.paymentService.markAsCancelled(transaction.order_id);
                    return { status: 'success' };
                }
                throw new UnauthorizedException(`Transaction status is ${status}`);
            }

            // Double check amount?
            if (Number(data.transaction.amount) !== Number(transaction.amount)) {
                console.error('[Pakasir] Verification failed: Amount mismatch');
                throw new UnauthorizedException('Amount mismatch');
            }

            // If verification passed, proceed to mark as paid
            await this.paymentService.markAsPaid(transaction.order_id);

        } catch (error) {
            console.error(`[Pakasir] Verification Error: ${error.message}`);
            if (error.response) {
                console.error('[Pakasir] API Response:', error.response.data);
            }
            throw new UnauthorizedException('Verification failed');
        }

        return { status: 'success' };
    }
}
