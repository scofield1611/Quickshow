import axios from "axios"
import Movie from "../models/Movie.js"
import Show from "../models/Show.js"


// API to fetch now playing movies from TMDB
export const getNowPlayingMovies = async(req , res) =>{
    try{
       const{data} = await axios.get('https://api.themoviedb.org/3/movie/now_playing',{
        headers :{Authorization: `Bearer ${process.env.TMDB_API_KEY} `}
       } )
    const movies = data.results;
    res.json({ success: true, movies: movies });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
}

// API to add a new show to the database
export const addShow = async (req, res) => {
  try {
    const { movieId, showsInput, showPrice, theatre, hallName, seatConfiguration } = req.body;

    let movie = await Movie.findById(movieId);

    if (!movie) {
      // Fetch movie details and credits from TMDB API
      const [movieDetailsResponse, movieCreditsResponse] = await Promise.all([
        axios.get(`https://api.themoviedb.org/3/movie/${movieId}` , {
          headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` }
        }),
        axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`, {
          headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` }
        })
      ]);
      const movieApiData = movieDetailsResponse.data;
      const movieCreditsData = movieCreditsResponse.data;

      const movieDetails = {
        _id: movieId,
        title: movieApiData.title,
        overview: movieApiData.overview,
        poster_path: movieApiData.poster_path,
        backdrop_path: movieApiData.backdrop_path,
        genres: movieApiData.genres,
        casts: movieCreditsData.cast,
        release_date: movieApiData.release_date,
        original_language: movieApiData.original_language,
        tagline: movieApiData.tagline || "",
        vote_average: movieApiData.vote_average,
        runtime: movieApiData.runtime,
      };
      // Add movie to the database
      movie = await Movie.create(movieDetails);
    }

    // Get or create default admin theatre
    let adminTheatre = theatre;
    if (!adminTheatre) {
      // Find or create a default admin theatre
      const Theatre = (await import("../models/Theatre.js")).default;
      let defaultTheatre = await Theatre.findOne({ name: "Admin Default Theatre" });

      if (!defaultTheatre) {
        const { userId } = req.auth();
        defaultTheatre = await Theatre.create({
          name: "Admin Default Theatre",
          owner: userId,
          address: {
            street: "Admin Office",
            city: "Mumbai",
            state: "Maharashtra",
            zipCode: "400001",
            country: "India"
          },
          contact: {
            phone: "1800-000-0000",
            email: "admin@quickshow.com"
          },
          approvalStatus: 'APPROVED',
          isActive: true
        });
      }
      adminTheatre = defaultTheatre._id;
    }

    const showsToCreate = [];
    showsInput.forEach((show) => {
      const showDate = show.date;
      show.time.forEach((time) => {
        const dateTimeString = `${showDate}T${time}`;
        showsToCreate.push({
          movie: movieId,
          theatre: adminTheatre,
          hallName: hallName || "Main Screen",
          showDateTime: new Date(dateTimeString),
          showPrice,
          totalSeats: seatConfiguration?.rows * seatConfiguration?.seatsPerRow || 150,
          seatConfiguration: seatConfiguration || { rows: 10, seatsPerRow: 15 },
          occupiedSeats: {},
        });
      });
    });

    if (showsToCreate.length > 0) {
      await Show.insertMany(showsToCreate);
    }

    res.json({ success: true, message: 'Shows added successfully' });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get all shows from the database
export const getShows = async (req, res) => {
  try {
    // Get all shows WITHOUT population first
    const shows = await Show.find({})
      .sort({ showDateTime: -1 })
      .lean();

    console.log('DEBUG getShows: Total shows found:', shows.length);

    // Build unique movies, handle both valid IDs and string titles
    const uniqueMoviesMap = new Map();

    for (const show of shows) {
      let movieKey, movieObj;

      if (show.movie && typeof show.movie === 'string') {
        // Try to find movie by ID first
        const movie = await Movie.findById(show.movie).lean();

        if (movie) {
          // Valid movie found by ID
          movieKey = movie._id;
          movieObj = movie;
          console.log('Valid movie found:', movie.title);
        } else {
          // Movie not found - it's a title string, create fallback
          movieKey = show.movie;
          movieObj = {
            id: show.movie,
            _id: show.movie,
            title: show.movie,
            poster_path: null,
            backdrop_path: null,
            vote_average: 7.0,
            release_date: "2025",
            overview: 'Available for booking',
            genres: [],
            runtime: 120
          };
          console.log('Fallback movie created:', show.movie);
        }

        if (!uniqueMoviesMap.has(movieKey)) {
          uniqueMoviesMap.set(movieKey, movieObj);
        }
      } else {
        console.log('Skipping show with invalid movie field:', show._id);
      }
    }

    const uniqueMovies = Array.from(uniqueMoviesMap.values());
    console.log('DEBUG: Returning', uniqueMovies.length, 'unique movies');

    res.json({ success: true, shows: uniqueMovies });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get all movies from database
export const getAllMovies = async (req, res) => {
  try {
    const movies = await Movie.find({}).sort({ release_date: -1 });
    res.json({ success: true, movies });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export const getShow = async (req, res) => {
  try {
    const { movieId } = req.params;
    // 1. Get all upcoming shows for this specific movie
    const shows = await Show.find({ 
      movie: movieId, 
      showDateTime: { $gte: new Date() } 
    });
    // 2. Get the movie's details
    const movie = await Movie.findById(movieId);
    // 3. Group the shows by date
    const DateTimes = {};
    shows.forEach((show) => {
      // Get the date part, e.g., "2025-10-11"
      const date = show.showDateTime.toISOString().split('T')[0];
      // If a key for this date doesn't exist, create it
      if (!DateTimes[date]) {
        DateTimes[date] = [];
      }
      // Add the show's time and ID to the array for that date
      DateTimes[date].push({ 
        time: show.showDateTime, 
        showId: show._id 
      });
    });

    res.json({ success: true, movie: movie, shows: DateTimes });

  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// Debug endpoint to check show data
export const debugShow = async (req, res) => {
  try {
    const { showId } = req.params;

    // Get show without population
    const showRaw = await Show.findById(showId).lean();
    console.log('Raw show data:', showRaw);

    // Get show with population
    const showPopulated = await Show.findById(showId)
      .populate('movie')
      .populate('theatre')
      .lean();
    console.log('Populated show data:', showPopulated);

    res.json({
      success: true,
      raw: showRaw,
      populated: showPopulated
    });

  } catch (error) {
    console.error('Debug error:', error);
    res.json({ success: false, message: error.message });
  }
};