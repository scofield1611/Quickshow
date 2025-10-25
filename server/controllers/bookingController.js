import Show from "../models/Show.js";
import Booking from '../models/Booking.js';
import Theatre from '../models/Theatre.js';
import Movie from '../models/Movie.js';
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

    // Get the show details with theatre (don't populate movie, it won't work)
    const showData = await Show.findById(showId)
      .populate('theatre')
      .lean();

    if (!showData) {
      return res.json({ success: false, message: "Show not found" });
    }

    // Manually fetch movie data
    let movieTitle = 'Movie';
    if (showData.movie && typeof showData.movie === 'string') {
      const movie = await Movie.findById(showData.movie).lean();
      if (movie) {
        movieTitle = movie.title;
        showData.movie = movie; // Attach full movie object
      } else {
        movieTitle = `Movie ${showData.movie}`;
      }
    }

    // Convert back to mongoose document for modifications
    const show = await Show.findById(showId).populate('theatre');

    // Verify theatre is approved
    if (show.theatre.approvalStatus !== 'APPROVED') {
      return res.json({
        success: false,
        message: "This theatre is not approved for bookings"
      });
    }

    // Check if the theatre is active
    if (!show.theatre.isActive) {
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
      theatre: show.theatre._id,
      amount: show.showPrice * selectedSeats.length,
      bookedSeats: selectedSeats
    });

    selectedSeats.map((seat) => {
      show.occupiedSeats[seat] = userId;
    });

    show.markModified('occupiedSeats');
    await show.save();

    // Stripe Gateway Initialize
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

    const theatreName = show.theatre.name;

    // Convert Rupees to USD for Stripe (approximate rate: 1 USD = 83 INR)
    // User sees price in Rupees, but Stripe processes in USD
    const amountInRupees = booking.amount;
    const conversionRate = 83; // 1 USD = 83 INR (update as needed)
    const amountInUSD = amountInRupees / conversionRate;

    console.log(`💰 Booking amount: ₹${amountInRupees} = $${amountInUSD.toFixed(2)} USD`);

    // Creating line items for Stripe
    const line_items = [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${movieTitle} - ${theatreName}`
        },
        unit_amount: Math.floor(amountInUSD * 100) // Convert to cents
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

    // Run Inngest Scheduler Function (optional - wrapped in try-catch)
    try {
      const { inngest } = await import('../inngest/index.js');
      await inngest.send({
        name: "app/checkpayment",
        data: {
          bookingId: booking._id.toString()
        }
      });
    } catch (inngestError) {
      console.log('Inngest scheduling skipped');
    }

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
      .populate('theatre', 'name address contact')
      .sort({ createdAt: -1 })
      .lean(); // Convert to plain JavaScript objects

    console.log(`📚 Found ${bookings.length} bookings for user ${userId}`);

    // Manually populate shows and handle movie field
    const processedBookings = await Promise.all(
      bookings.map(async (booking, index) => {
        const show = await Show.findById(booking.show).lean();

        if (show) {
          console.log(`📽️ Processing booking ${index + 1}, show movie field:`, show.movie, typeof show.movie);

          // Try to populate movie if it's an ID
          if (show.movie && typeof show.movie === 'string') {
            const movie = await Movie.findById(show.movie).lean();

            if (movie) {
              // Movie found - use it
              console.log(`✅ Movie found by ID:`, movie.title);
              show.movie = movie;
            } else {
              // Movie not found - it's probably a title string, create fallback
              console.log(`⚠️ Movie not found by ID, using title as fallback:`, show.movie);
              show.movie = {
                _id: 'unknown',
                title: show.movie, // Use the string as title
                poster_path: null,
                backdrop_path: null,
                overview: 'Movie information not available',
                genres: [],
                vote_average: 0,
                release_date: new Date().toISOString().split('T')[0],
                runtime: 0
              };
              console.log(`📦 Created fallback movie object:`, show.movie);
            }
          } else {
            console.log(`❌ Show has no movie field or invalid type`);
          }

          booking.show = show;
        } else {
          console.log(`❌ Show not found for booking ${index + 1}`);
        }

        return booking;
      })
    );

    console.log(`✨ Returning ${processedBookings.length} processed bookings`);

    res.json({ success: true, bookings: processedBookings });

  } catch (error) {
    console.log('❌ getUserBookings error:', error.message);
    console.error('Full error:', error);
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
      .populate('theatre', 'name address')
      .sort({ showDateTime: 1 })
      .lean();

    // Manually populate movie data
    const processedShows = await Promise.all(
      shows.map(async (show) => {
        let movieData = null;

        if (show.movie && typeof show.movie === 'string') {
          movieData = await Movie.findById(show.movie).lean();

          if (!movieData) {
            // Fallback
            movieData = {
              _id: show.movie,
              title: `Movie ${show.movie}`,
              poster_path: null
            };
          }
        }

        return {
          ...show,
          movie: movieData
        };
      })
    );

    res.json({ success: true, shows: processedShows });

  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};