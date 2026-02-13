import { Injectable } from '@nestjs/common';
import * as mongoose from 'mongoose';
import { config } from '../../config/configuration';

// Define interfaces for type safety
interface ITopupHistory extends mongoose.Document {
    userId: string;
    amount: number;
    status: 'Paid' | 'Cancelled' | 'Pending';
    orderId: string;
}

interface IUser extends mongoose.Document {
    userId: string;
    balance: number;
    growId: string | null;
}

interface ISettings extends mongoose.Document {
    guildId: string;
    donateRate: number;
}

// Define TopupHistory schema directly here for simplicity
const topupHistorySchema = new mongoose.Schema(
    {
        userId: { type: String, required: true },
        amount: { type: Number, required: true },
        status: {
            type: String,
            enum: ['Paid', 'Cancelled', 'Pending'],
            default: 'Pending',
        },
        orderId: {
            type: String,
            required: true,
            unique: true,
            index: true,
            immutable: true,
        },
    },
    { timestamps: true },
);

const userSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true },
        balance: { type: Number, required: true },
        growId: { type: String, default: null },
    },
    { timestamps: true },
);

const settingsSchema = new mongoose.Schema(
    {
        guildId: { type: String, required: true, unique: true },
        donateRate: { type: Number, default: 100 },
    },
    { timestamps: true },
);

@Injectable()
export class PaymentService {
    private connection: mongoose.Connection | null = null;
    private TopupHistory: mongoose.Model<ITopupHistory> | null = null;

    async getConnection(): Promise<mongoose.Connection> {
        if (!this.connection) {
            this.connection = await mongoose.createConnection(config.mongodb.uri, {
                dbName: config.mongodb.dbName,
            }).asPromise();

            this.TopupHistory = this.connection.model<ITopupHistory>('topuphistory', topupHistorySchema);
            this.connection.model<IUser>('user', userSchema);
            this.connection.model<ISettings>('adminSettings', settingsSchema);
            console.log('[PaymentService] MongoDB connected');
        }
        return this.connection;
    }

    async logDonation(growId: string, amount: number): Promise<boolean> {
        try {
            await this.getConnection();
            const User = this.connection!.model<IUser>('user');
            const Settings = this.connection!.model<ISettings>('adminSettings');

            // Find user by growId
            const user = await User.findOne({ growId });
            if (!user) {
                console.log(`[PaymentService] User with GrowID ${growId} not found`);
                return false;
            }

            // Get donation rate
            const settings = await Settings.findOne({});
            const rate = settings?.donateRate || 100;

            const rupiah = amount * rate / 100;

            // Update user balance
            await User.findOneAndUpdate(
                { growId },
                { $inc: { balance: rupiah } }
            );

            console.log(`[PaymentService] Processed donation for ${growId}: ${amount} units -> Rp ${rupiah}`);
            return true;
        } catch (error) {
            console.error('[PaymentService] Error processing donation:', error);
            throw error;
        }
    }

    /**
     * Update payment status to 'Paid'
     */
    async markAsPaid(orderId: string): Promise<boolean> {
        try {
            await this.getConnection();

            const result = await this.TopupHistory!.findOneAndUpdate(
                { orderId, status: 'Pending' },
                { status: 'Paid' },
                { new: true },
            );

            if (result) {
                console.log(`[PaymentService] Order ${orderId} marked as Paid`);
                // Flag all stock messages for refresh so the bot updates them
                try {
                    const StockMessage = this.connection!.model('stockMessage',
                        new (require('mongoose').Schema)({
                            channelId: String,
                            messageId: String,
                            needsRefresh: { type: Boolean, default: false },
                        })
                    );
                    await StockMessage.updateMany({}, { needsRefresh: true });
                } catch (e) {
                    // Model might already be registered, try direct update
                    try {
                        const StockMessage = this.connection!.model('stockMessage');
                        await StockMessage.updateMany({}, { needsRefresh: true });
                    } catch (_) { }
                }
                return true;
            } else {
                console.log(`[PaymentService] Order ${orderId} not found or already processed`);
                return false;
            }
        } catch (error) {
            console.error('[PaymentService] Error updating payment:', error);
            throw error;
        }
    }

    /**
     * Update payment status to 'Cancelled'
     */
    async markAsCancelled(orderId: string): Promise<boolean> {
        try {
            await this.getConnection();

            const result = await this.TopupHistory!.findOneAndUpdate(
                { orderId, status: 'Pending' },
                { status: 'Cancelled' },
                { new: true },
            );

            if (result) {
                console.log(`[PaymentService] Order ${orderId} marked as Cancelled`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('[PaymentService] Error cancelling payment:', error);
            throw error;
        }
    }

    /**
     * Get order details
     */
    async getOrder(orderId: string): Promise<any> {
        try {
            await this.getConnection();
            return await this.TopupHistory!.findOne({ orderId });
        } catch (error) {
            console.error('[PaymentService] Error getting order:', error);
            throw error;
        }
    }
}
