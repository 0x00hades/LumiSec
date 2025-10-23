import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema(
  {
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipient', required: true, index: true },
    eventType: { type: String, enum: ['sent', 'open', 'click', 'delivered', 'delivery_failed'], required: true, index: true },
    ts: { type: Date, default: Date.now },
    to: { type: String },
  },
  { versionKey: false }
);

EventSchema.index({ campaignId: 1, recipientId: 1, eventType: 1 });

export default mongoose.model('Event', EventSchema);


