import { Module } from '@nestjs/common';
import { CallbacksModule } from './callbacks/callbacks.module';

@Module({
    imports: [CallbacksModule],
})
export class AppModule { }
