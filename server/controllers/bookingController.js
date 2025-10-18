import Show from "../models/Show.js";
import Booking from '../models/Booking.js';
import Theatre from '../models/Theatre.js';
import stripe from 'stripe';

// Function to check availability of selected seats for a movie
const checkSeatsAvailability = async (showId, selectedSeats) => {
  try {
    const showData = await Show.findById(showId);
    if (!showData) return false;

    const occupiedSeats = showData.occupiedSeats;

    const isAnySeatTaken = selectedSeats.some(seat => occupiedSeats[seat]);

    return !isAnySeatTaken;
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

export const createBooking = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { showId, selectedSeats } = req.body;
    const { origin } = req.headers;

    // Get the show details with theatre
    const showData = await Show.findById(showId)
      .populate('movie')
      .populate('theatre');

    if (!showData) {
      return res.json({ success: false, message: "Show not found" });
    }

    // Verify theatre is approved
    if (showData.theatre.approvalStatus !== 'APPROVED') {
      return res.json({
        success: false,
        message: "This theatre is not approved for bookings"
      });
    }

    // Check if the theatre is active
    if (!showData.theatre.isActive) {
      return res.json({
        success: false,
        message: "This theatre is currently inactive"
      });
    }

    // Check if the seat is available for the selected show
    const isAvailable = await checkSeatsAvailability(showId, selectedSeats);

    if (!isAvailable) {
      return res.json({ success: false, message: "Selected Seats are not available." });
    }

    // Create a new booking
    const booking = await Booking.create({
      user: userId,
      show: showId,
      theatre: showData.theatre._id,
      amount: showData.showPrice * selectedSeats.length,
      bookedSeats: selectedSeats
    });

    selectedSeats.map((seat) => {
      showData.occupiedSeats[seat] = userId;
    });

    showData.markModified('occupiedSeats');
    await showData.save();

    // Stripe Gateway Initialize
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

    // Creating line items for Stripe
    const line_items = [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${showData.movie.title} - ${showData.theatre.name}`
        },
        unit_amount: Math.floor(booking.amount) * 100
      },
      quantity: 1
    }];

    // Create a Stripe Checkout session
    const session = await stripeInstance.checkout.sessions.create({
      success_url: `${origin}/loading/my-bookings`,
      cancel_url: `${origin}/my-bookings`,
      line_items: line_items,
      mode: 'payment',
      metadata: {
        bookingId: booking._id.toString()
      },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // Expires in 30 minutes
    });

    booking.paymentLink = session.url;
    await booking.save();

    // Run Inngest Scheduler Function to check payment status after 10 minutes
    await inngest.send({
      name: "app/checkpayment",
      data: {
        bookingId: booking._id.toString()
      }
    });

    res.json({success: true, url : session.url})

  } catch (error) {
    console.log(error.message);
    res.json({success: false, message: 'Booking failed'})
  }
}

export const getOccupiedSeats = async (req, res) => {
  try {
    const { showId } = req.params;
    const showData = await Show.findById(showId);

    if (!showData) {
      return res.json({ success: false, message: "Show not found" });
    }

    const occupiedSeats = Object.keys(showData.occupiedSeats);

    res.json({ success: true, occupiedSeats });

  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Get user's bookings with theatre details
export const getUserBookings = async (req, res) => {
  try {
    const { userId } = req.auth();

    const bookings = await Booking.find({ user: userId })
      .populate({
        path: 'show',
        populate: { path: 'movie' }
      })
      .populate('theatre', 'name address contact')
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });

  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Get shows by theatre and movie (for users)
export const getShowsByTheatreAndMovie = async (req, res) => {
  try {
    const { theatreId, movieId } = req.query;
    const { date } = req.query; // Optional date filter

    const filter = {
      theatre: theatreId,
      movie: movieId
    };

    // Only show future shows
    filter.showDateTime = { $gte: new Date() };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      filter.showDateTime = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }

    // Verify theatre is approved
    const theatre = await Theatre.findById(theatreId);
    if (!theatre || theatre.approvalStatus !== 'APPROVED' || !theatre.isActive) {
      return res.json({
        success: false,
        message: "Theatre not available for bookings"
      });
    }

    const shows = await Show.find(filter)
      .populate('movie')
      .populate('theatre', 'name address')
      .sort({ showDateTime: 1 });

    res.json({ success: true, shows });

  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};