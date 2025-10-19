import { StarIcon } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import timeformat from '../lib/timeformat';
import { useAppContext } from '../context/AppContext';

const MovieCard = ({ movie }) => {
  const navigate = useNavigate();
  const { image_base_url } = useAppContext();

  // THE FIX: Add this check to prevent crashes.
  // If the movie prop is empty, render nothing.
  if (!movie) {
    return null;
  }

  const movieId = movie._id || movie.id;

  const handleNavigate = () => {
    if (movieId) {
      navigate(`/Movies/${movieId}`);
      scrollTo(0, 0);
    }
  };

  return (
    <div className='flex flex-col justify-between p-3 bg-gray-800
    rounded-2xl hover:-translate-y-1 transition duration-300 w-60'>

      {movie.backdrop_path ? (
        <img
          onClick={handleNavigate}
          src={image_base_url + movie.backdrop_path}
          alt={movie.title}
          className='rounded-lg h-52 w-full object-cover cursor-pointer'
        />
      ) : (
        <div
          onClick={handleNavigate}
          className='rounded-lg h-52 w-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 
            flex items-center justify-center cursor-pointer hover:from-pink-500/30 hover:to-purple-500/30 transition'
        >
          <div className='text-center p-4'>
            <div className='text-5xl mb-2'>🎬</div>
            <p className='text-white font-medium text-sm'>{movie.title}</p>
          </div>
        </div>
      )}

      <p className='font-semibold mt-2 truncate'>{movie.title}</p>
      
      <p className="text-sm text-gray-400 mt-2">
        {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'} • 
        {movie.genres?.slice(0, 2).map(genre => genre.name).join(" | ")}
        {movie.runtime ? ` • ${timeformat(movie.runtime)}` : ''}
      </p>

      <div className='flex items-center justify-between mt-4'>
        <button
          onClick={handleNavigate}
          className='px-4 py-2 text-xs bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer'>
          Buy Tickets
        </button>

        <p className='flex items-center gap-1 text-sm text-gray-400'>
          <StarIcon className='w-4 h-4 text-primary fill-primary' />
          {movie.vote_average?.toFixed(1)}
        </p>
      </div>
    </div>
  );
};

export default MovieCard;