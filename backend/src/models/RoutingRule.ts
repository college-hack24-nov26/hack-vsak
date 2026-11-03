import mongoose, { Document, Model, Schema } from 'mongoose';
import type { ProviderCategory } from './VaultSecret.js';

export interface IRoutingRule extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  category: ProviderCategory;
  primaryProviderId: string;
  fallbackProviderId: string;
  fallbackProviderIds: string[];
  timeoutMs: number;
  retryOnStatusCodes: number[];
  createdAt: Date;
  updatedAt: Date;
}

const RoutingRuleSchema = new Schema<IRoutingRule>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['ai', 'music', 'weather', 'news', 'environment'],
      required: true,
      index: true,
    },
    primaryProviderId: {
      type: String,
      required: true,
    },
    fallbackProviderId: {
      type: String,
      default: 'none',
    },
    fallbackProviderIds: {
      type: [String],
      default: [],
    },
    timeoutMs: {
      type: Number,
      default: 5000,
    },
    retryOnStatusCodes: {
      type: [Number],
      default: [429, 500, 502, 503, 504],
    },
  },
  {
    timestamps: true,
  }
);

RoutingRuleSchema.index({ userId: 1, category: 1 }, { unique: true });

export const RoutingRule: Model<IRoutingRule> = mongoose.model<IRoutingRule>('RoutingRule', RoutingRuleSchema);
