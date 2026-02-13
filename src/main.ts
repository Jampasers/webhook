import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Enable CORS for webhook callbacks
    app.enableCors();

    // Set global prefix
    app.setGlobalPrefix('api');

    const port = process.env.PORT || 3001;
    await app.listen(port);

    console.log(`🚀 Payment Callback API running on port ${port}`);
}

bootstrap();
