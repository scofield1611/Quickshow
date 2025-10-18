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
    const { movieId, showsInput, showPrice } = req.body;

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

  const showsToCreate = [];
  showsInput.forEach((show) => {
    const showDate = show.date;
    show.time.forEach((time) => {
      const dateTimeString = `${showDate}T${time}`;
      showsToCreate.push({
        movie: movieId,
        showDateTime: new Date(dateTimeString),
        showPrice,
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
    const shows = await Show.find({ showDateTime: { $gte: new Date() } }).populate('movie').sort({ showDateTime: 1 });

    // filter unique shows
    const uniqueShows = new Set(shows.map(show => show.movie));

    res.json({ success: true, shows: Array.from(uniqueShows) });
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