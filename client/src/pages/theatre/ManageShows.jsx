import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import Loading from '../../components/Loading';
import Title from '../../components/admin/Title';
import { 
  PlusIcon, 
  Trash2Icon, 
  CalendarIcon,
  DollarSignIcon,
  UsersIcon,
  PlayCircleIcon,
  ArrowLeftIcon
} from 'lucide-react';
import dateFormat from '../../lib/dateFormat';

const ManageShows = () => {
  const { theatreId } = useParams();
  const navigate = useNavigate();
  const { axios, getToken, image_base_url } = useAppContext();
  const [theatre, setTheatre] = useState(null);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTheatre = async () => {
    try {
      const { data } = await axios.get(`/api/theatre/${theatreId}`, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });

      if (data.success) {
        setTheatre(data.theatre);
      } else {
        toast.error('Theatre not found');
        navigate('/theatre/my-theatres');
      }
    } catch (error) {
      toast.error('Error fetching theatre');
      console.error(error);
    }
  };

  const fetchShows = async () => {
    try {
      const { data } = await axios.get(`/api/theatre/${theatreId}/shows`, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });

      if (data.success) {
        setShows(data.shows);
      }
    } catch (error) {
      toast.error('Error fetching shows');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTheatre();
    fetchShows();
  }, [theatreId]);

  const handleDeleteShow = async (showId) => {
    if (!confirm('Are you sure you want to delete this show? This action cannot be undone.')) return;

    try {
      const { data } = await axios.delete(
        `/api/theatre/${theatreId}/shows/${showId}`,
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (data.success) {
        toast.success('Show deleted successfully');
        fetchShows();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Error deleting show');
      console.error(error);
    }
  };

  if (loading) return <Loading />;

  return (
    <>
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-4'>
          <button
            onClick={() => navigate('/theatre/my-theatres')}
            className='p-2 hover:bg-primary/10 rounded-lg transition-colors'
          >
            <ArrowLeftIcon className='w-5 h-5' />
          </button>
          <div>
            <Title text1="Manage" text2="Shows" />
            {theatre && (
              <p className='text-gray-400 mt-2'>
                Theatre: <span className='text-white font-medium'>{theatre.name}</span>
                <span className='ml-3 text-sm'>({theatre.address.city})</span>
              </p>
            )}
          </div>
        </div>
        <Link
          to={`/theatre/add-show/${theatreId}`}
          className='px-4 py-2 bg-primary hover:bg-primary/80 rounded-md 
            transition-colors flex items-center gap-2'
        >
          <PlusIcon className='w-4 h-4' />
          Add Show
        </Link>
      </div>

      {/* Shows Grid */}
      {shows.length > 0 ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {shows.map((show) => (
            <div 
              key={show._id}
              className='bg-primary/10 border border-primary/20 rounded-lg overflow-hidden
                hover:bg-primary/15 transition-all hover:shadow-xl'
            >
              {/* Movie Poster */}
              {show.movie && (
                <div className='relative'>
                  <img 
                    src={image_base_url + show.movie.poster_path} 
                    alt={show.movie.title}
                    className='w-full h-64 object-cover'
                  />
                  <div className='absolute top-2 right-2 px-3 py-1 bg-black/70 
                    backdrop-blur-sm rounded-full text-sm font-medium'>
                    {show.hallName}
                  </div>
                </div>
              )}

              <div className='p-4'>
                {/* Movie Title */}
                <h3 className='text-lg font-medium mb-3 truncate'>
                  {show.movie?.title || 'Unknown Movie'}
                </h3>

                {/* Show Details */}
                <div className='space-y-2 mb-4'>
                  <div className='flex items-center gap-2 text-sm text-gray-400'>
                    <CalendarIcon className='w-4 h-4' />
                    <span>{dateFormat(show.showDateTime)}</span>
                  </div>
                  <div className='flex items-center gap-2 text-sm text-gray-400'>
                    <DollarSignIcon className='w-4 h-4' />
                    <span className='text-primary font-medium'>₹{show.showPrice}</span>
                  </div>
                  <div className='flex items-center gap-2 text-sm text-gray-400'>
                    <UsersIcon className='w-4 h-4' />
                    <span>
                      {Object.keys(show.occupiedSeats || {}).length} / {show.totalSeats} booked
                    </span>
                  </div>
                  <div className='flex items-center gap-2 text-sm text-gray-400'>
                    <PlayCircleIcon className='w-4 h-4' />
                    <span>
                      {show.seatConfiguration?.rows} × {show.seatConfiguration?.seatsPerRow} layout
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className='mb-4'>
                  <div className='flex justify-between text-xs text-gray-400 mb-1'>
                    <span>Booking Progress</span>
                    <span>
                      {Math.round((Object.keys(show.occupiedSeats || {}).length / show.totalSeats) * 100)}%
                    </span>
                  </div>
                  <div className='w-full bg-gray-700 rounded-full h-2'>
                    <div 
                      className='bg-primary h-2 rounded-full transition-all'
                      style={{ 
                        width: `${(Object.keys(show.occupiedSeats || {}).length / show.totalSeats) * 100}%` 
                      }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className='flex gap-2 pt-3 border-t border-gray-700'>
                  <button
                    onClick={() => handleDeleteShow(show._id)}
                    className='flex-1 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 
                      border border-red-500/30 rounded-md transition-colors 
                      flex items-center justify-center gap-2 text-sm'
                  >
                    <Trash2Icon className='w-4 h-4' />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className='text-center py-12 bg-primary/10 border border-primary/20 rounded-lg'>
          <PlayCircleIcon className='w-16 h-16 mx-auto text-gray-600 mb-4' />
          <h3 className='text-xl font-medium mb-2'>No Shows Yet</h3>
          <p className='text-gray-400 mb-6'>Add your first show to get started</p>
          <Link
            to={`/theatre/add-show/${theatreId}`}
            className='inline-flex items-center gap-2 px-6 py-3 bg-primary 
              hover:bg-primary/80 rounded-md transition-colors'
          >
            <PlusIcon className='w-5 h-5' />
            Add Show
          </Link>
        </div>
      )}
    </>
  );
};

export default ManageShows;
