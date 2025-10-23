import mongoose from 'mongoose';

const RecipientSchema = new mongoose.Schema(
  {
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    email: { type: String, required: true, index: true },
    user_name: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
  }
);

RecipientSchema.index({ campaignId: 1, email: 1 }, { unique: true });

export default mongoose.model('Recipient', RecipientSchema);


