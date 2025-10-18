import mongoose from "mongoose";

const theatreSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    owner: { type: String, required: true, ref: 'User' },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true }
    },
    contact: {
      phone: { type: String, required: true },
      email: { type: String, required: true }
    },
    policies: {
      cancellationPolicy: { type: String },
      refundPolicy: { type: String },
      otherPolicies: { type: String }
    },
    approvalStatus: {
      type: String,
      enum: ['PENDING_APPROVAL', 'APPROVED', 'REJECTED'],
      default: 'PENDING_APPROVAL'
    },
    rejectionReason: { type: String },
    approvedAt: { type: Date },
    approvedBy: { type: String, ref: 'User' },
    totalHalls: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Index for faster queries
theatreSchema.index({ owner: 1 });
theatreSchema.index({ approvalStatus: 1 });
theatreSchema.index({ 'address.city': 1 });

const Theatre = mongoose.model("Theatre", theatreSchema);

export default Theatre;
