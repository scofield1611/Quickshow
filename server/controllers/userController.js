import { clerkClient } from "@clerk/express";
import Booking from "../models/Booking.js";
import Movie from "../models/Movie.js";

// API Controller Function to Get User Bookings
export const getUserBookings = async (req, res) => {
  try {
    const user = req.auth().userId;

    const bookings = await Booking.find({ user })
      .populate('theatre')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`📚 Found ${bookings.length} bookings for user ${user}`);

    // Manually populate shows and handle movie field
    const processedBookings = await Promise.all(
      bookings.map(async (booking, index) => {
        const Show = (await import("../models/Show.js")).default;
        const show = await Show.findById(booking.show).lean();

        if (show) {
          console.log(`📽️ Booking ${index + 1} - show movie field:`, show.movie, typeof show.movie);

          // Try to populate movie if it's a string
          if (show.movie && typeof show.movie === 'string') {
            const movie = await Movie.findById(show.movie).lean();

            if (movie) {
              // Movie found by ID - use full movie object
              console.log(`✅ Movie found by ID:`, movie.title);
              show.movie = movie;
            } else {
              // Movie not found - it's a title string, create fallback
              console.log(`⚠️ Movie ID not found, using as title:`, show.movie);
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
              console.log(`📦 Created fallback movie:`, show.movie.title);
            }
          } else {
            console.log(`❌ Show has no valid movie field`);
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
    console.error('❌ getUserBookings error:', error.message);
    res.json({ success: false, message: error.message });
  }
};
// API Controller Function to update a Movie to User's Favorites
export const updateFavorite = async (req, res) => {
  try {
    const { movieId } = req.body;
    const userId = req.auth().userId;

    const user = await clerkClient.users.getUser(userId);

    if (!user.privateMetadata.favorites) {
      user.privateMetadata.favorites = [];
    }

    if (!user.privateMetadata.favorites.includes(movieId)) {
      user.privateMetadata.favorites.push(movieId);
    } else {
  user.privateMetadata.favorites = user.privateMetadata.favorites.filter(
    (item) => item !== movieId
        );
    }

    await clerkClient.users.updateUserMetadata(userId, { privateMetadata: user.privateMetadata });

    res.json({ success: true, message: "Favorite movies Updated successfully." });

  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export const getFavorites = async (req, res) => {
  try {
    const user = await clerkClient.users.getUser(req.auth().userId);
    const favorites = user.privateMetadata.favorites;

    // Getting movies from database
    const movies = await Movie.find({ _id: { $in: favorites } });

    res.json({ success: true, movies });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};