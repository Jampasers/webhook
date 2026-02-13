import { Module } from '@nestjs/common';
import { PaymentService } from '../common/services/payment.service';

// Import all callback controllers
import { TokopayController } from './tokopay/tokopay.controller';
import { PakasirController } from './pakasir/pakasir.controller';
import { DuitkuController } from './duitku/duitku.controller';
import { TripayController } from './tripay/tripay.controller';
import { MidtransController } from './midtrans/midtrans.controller';
import { FazzController } from './fazz/fazz.controller';
import { XenditController } from './xendit/xendit.controller';
import { DokuController } from './doku/doku.controller';
import { DonateController } from './donate/donate.controller';
import { QrispwController } from './qrispw/qrispw.controller';

@Module({
    controllers: [
        TokopayController,
        PakasirController,
        DuitkuController,
        TripayController,
        MidtransController,
        FazzController,
        XenditController,
        DokuController,
        DonateController,
        QrispwController,
    ],
    providers: [PaymentService],
})
export class CallbacksModule { }
