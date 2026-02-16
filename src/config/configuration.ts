export const config = {
    // Payment Gateway Credentials (sama dengan config.js di root)
    paymentGateway: {
        tokopay: {
            merchantId: process.env.TOKOPAY_MERCHANT_ID || '',
            secret: process.env.TOKOPAY_SECRET || '',
        },
        pakasir: {
            projectSlug: process.env.PAKASIR_PROJECT_SLUG || '',
            apiKey: process.env.PAKASIR_API_KEY || '',
        },
        qrispw: {
            apiKey: process.env.QRISPW_API_KEY || '',
            apiSecret: process.env.QRISPW_API_SECRET || '',
        },
        duitku: {
            merchantCode: process.env.DUITKU_MERCHANT_CODE || 'YOUR_MERCHANT_CODE',
            apiKey: process.env.DUITKU_API_KEY || 'YOUR_API_KEY',
        },
        tripay: {
            merchantCode: process.env.TRIPAY_MERCHANT_CODE || 'YOUR_MERCHANT_CODE',
            privateKey: process.env.TRIPAY_PRIVATE_KEY || 'YOUR_PRIVATE_KEY',
        },
        midtrans: {
            serverKey: process.env.MIDTRANS_SERVER_KEY || 'YOUR_SERVER_KEY',
        },
        fazz: {
            apiKey: process.env.FAZZ_API_KEY || 'YOUR_API_KEY',
        },
        xendit: {
            callbackToken: process.env.XENDIT_CALLBACK_TOKEN || 'YOUR_CALLBACK_TOKEN',
        },
        doku: {
            clientId: process.env.DOKU_CLIENT_ID || 'YOUR_CLIENT_ID',
            secretKey: process.env.DOKU_SECRET_KEY || 'YOUR_SECRET_KEY',
        },
    },

    // MongoDB Connection (untuk update status)
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb+srv://danka:lP7hfYQMP94sXhu1@dankaassist.fek1f.mongodb.net/?appName=DankaAssist',
        dbName: process.env.MONGODB_DB_NAME || 'autoOrder',
    },
};
