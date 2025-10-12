import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Heart, PlayCircleIcon, StarIcon } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';

import Loading from '../components/Loading';
import BlurCircle from '../components/Blurcircle';
import DateSelect from '../components/dateSelect';
import MovieCard from '../components/MovieCard';
import timeformat from '../lib/timeformat';
import dateFormat from '../lib/dateFormat'; // Assuming you have this helper

const MovieDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get the movie ID from the URL

  const { shows, axios, getToken, user, fetchFavoriteMovies, favoriteMovies, image_base_url } = useAppContext();

  const [showData, setShowData] = useState(null);
  const [loading, setLoading] = useState(true);

  const getShow = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/shows/${id}`);
      if (data.success) {
        setShowData(data);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load movie details.");
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async () => {
    try {
      if (!user) return toast.error("Please login to proceed");
      const { data } = await axios.post('/api/user/update-favorite', { movieId: id }, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });
      if (data.success) {
        await fetchFavoriteMovies();
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (id) {
      getShow();
    }
  }, [id]);

  // Derived state for cleaner JSX
  const isFavorite = useMemo(() => {
    if (!showData?.movie || !favoriteMovies) return false;
    return favoriteMovies.some(favMovie => favMovie._id === showData.movie._id);
  }, [favoriteMovies, showData]);

  const recommendedShows = useMemo(() => {
    if (!showData?.movie || !shows) return [];
    return shows.filter(s => s._id !== showData.movie._id).slice(0, 4);
  }, [shows, showData]);

  if (loading) {
    return <Loading />;
  }

  if (!showData || !showData.movie) {
    return <div className='text-center mt-20'>Movie not found.</div>;
  }
  
  // Destructure for easier access in JSX
  const { movie, shows: groupedShows } = showData;

  return (
    <div className='px-6 md:px-16 lg:px-40 py-10 md:pt-20'>
      <div className='flex flex-col md:flex-row gap-8 max-w-6xl mx-auto'>
        <img src={image_base_url + movie.poster_path} alt='movie poster' className='max-md:mx-auto rounded-xl h-104 max-w-70 object-cover' />
        <div className='relative flex flex-col gap-3'>
          <BlurCircle top='-100px' left='-100px' />
          <p className='text-primary'>{movie.original_language?.toUpperCase()}</p>
          <h1 className='text-4xl font-bold max-w-lg text-balance'>{movie.title}</h1>
          <div className='flex items-center gap-2 text-gray-300'>
            <StarIcon className='w-5 h-5 text-primary fill-primary' />
            {movie.vote_average?.toFixed(1)} User Ratings
          </div>
          <p className='text-gray-400 max-w-xl mt-2 text-sm leading-relaxed'>
            {movie.overview}
          </p>
          <p className='text-gray-300'>
            {timeformat(movie.runtime)} | {movie.genres?.map(genre => genre.name).join(", ")} | {movie.release_date?.split("-")[0]}
          </p>
          <div className='flex items-center flex-wrap gap-4 mt-4'>
            <button className='flex items-center gap-2 px-7 py-3 text-sm bg-gray-800 hover:bg-gray-700 transition rounded font-medium cursor-pointer active:scale-95'>
              <PlayCircleIcon className='w-5 h-5' />
              Watch Trailer
            </button>
            <a href="#dateSelect" className='px-10 py-3 text-sm bg-primary hover:bg-primary/90 transition rounded-md font-medium cursor-pointer active:scale-95'>Buy Tickets</a>
            <button onClick={handleFavorite} className='bg-gray-700 p-2.5 rounded-full transition cursor-pointer active:scale-95'>
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-primary text-primary' : 'text-white'}`} />
            </button>
          </div>
        </div>
      </div>

      <p className='text-lg font-medium mt-20'>Cast</p>
      <div className='overflow-x-auto no-scrollbar mt-6 pb-4'>
        <div className='flex items-center gap-4 w-max'>
          {movie.casts?.filter(cast => cast.profile_path).slice(0, 12).map((cast) => (
            <div key={cast.id} className='flex flex-col items-center text-center w-24'>
              <img src={image_base_url + cast.profile_path} alt={cast.name} className='h-20 w-20 aspect-square object-cover rounded-full' />
              <p className='text-xs font-medium mt-2'>{cast.name}</p>
            </div>
          ))}
        </div>
      </div>

      <DateSelect dateTime={groupedShows} id={id} />

      <p className='text-lg font-medium mt-20 mb-8'>You May Also Like</p>
      <div className='flex flex-wrap justify-center md:justify-start gap-8'>
        {recommendedShows.map((recMovie) => (
          <MovieCard key={recMovie._id || recMovie.id} movie={recMovie} />
        ))}
      </div>
      <div className='flex justify-center mt-12'>
        <button onClick={() => { navigate('/movies'); scrollTo(0, 0) }} className='px-10 py-3 text-sm bg-primary hover:bg-primary/90 transition rounded-md font-medium cursor-pointer'>Show More</button>
      </div>
    </div>
  );
};

export default MovieDetails;