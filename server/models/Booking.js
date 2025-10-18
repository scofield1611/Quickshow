import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  user: { type: String, required: true, ref: 'User' },
  show: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Show' },
  theatre: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Theatre' },
  amount: { type: Number, required: true },
  bookedSeats: { type: Array, required: true },
  isPaid: { type: Boolean, default: false },
  paymentLink: { type: String },
}, { timestamps: true });

// Index for faster queries
bookingSchema.index({ user: 1 });
bookingSchema.index({ show: 1 });
bookingSchema.index({ theatre: 1 });

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;