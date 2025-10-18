import mongoose from "mongoose";

const showSchema = new mongoose.Schema(
  {
    movie: { type: String, required: true, ref: 'Movie' },
    theatre: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Theatre' },
    hallName: { type: String, required: true }, // Auditorium/Hall name
    showDateTime: { type: Date, required: true },
    showPrice: { type: Number, required: true },
    totalSeats: { type: Number, required: true },
    occupiedSeats: { type: Object, default: {} },
    seatConfiguration: {
      rows: { type: Number, required: true },
      seatsPerRow: { type: Number, required: true }
    }
  },
  { minimize: false, timestamps: true }
);

// Index for faster queries
showSchema.index({ theatre: 1, showDateTime: 1 });
showSchema.index({ movie: 1 });

const Show = mongoose.model("Show", showSchema);

export default Show;