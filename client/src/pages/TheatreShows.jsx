import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';
import Loading from '../components/Loading';
import {
  TheaterIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  DollarSignIcon,
  ArrowLeftIcon,
  FilmIcon,
  PhoneIcon,
  IndianRupee
} from 'lucide-react';
import dateFormat from '../lib/dateFormat';

const TheatreShows = () => {
  const { theatreId } = useParams();
  const navigate = useNavigate();
  const { axios, getToken, image_base_url } = useAppContext();
  const [theatre, setTheatre] = useState(null);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const currency = import.meta.env.VITE_CURRENCY;

  const fetchTheatre = async () => {
    try {
      // Try with auth first
      let config = {};
      try {
        const token = await getToken();
        if (token) {
          config.headers = { Authorization: `Bearer ${token}` };
        }
      } catch (e) {
        // No auth available, proceed without it
        console.log('No auth token, fetching as public');
      }

      const { data } = await axios.get(`/api/theatre/${theatreId}`, config);

      if (data.success) {
        setTheatre(data.theatre);
      } else {
        toast.error('Theatre not found');
      }
    } catch (error) {
      console.error('Error fetching theatre:', error);
      toast.error('Error fetching theatre details');
    }
  };

  const fetchShows = async () => {
    try {
      // Try with auth first
      let config = {};
      try {
        const token = await getToken();
        if (token) {
          config.headers = { Authorization: `Bearer ${token}` };
        }
      } catch (e) {
        // No auth available, proceed without it
        console.log('No auth token, fetching as public');
      }

      const { data } = await axios.get(`/api/theatre/${theatreId}/shows`, config);

      console.log('Shows API response:', data);
      console.log('Shows count:', data.shows?.length);
      console.log('All shows:', data.shows);

      if (data.success) {
        // Don't filter by date - show ALL shows including past ones for now
        console.log('Setting shows:', data.shows);
        setShows(data.shows || []);
      } else {
        console.log('API returned success: false');
        toast.error('No shows available');
      }
    } catch (error) {
      console.error('Error fetching shows:', error);
      toast.error('Error fetching shows');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTheatre();
    fetchShows();
  }, [theatreId]);

  // Group shows by date
  const showsByDate = shows.reduce((acc, show) => {
    const date = new Date(show.showDateTime).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(show);
    return acc;
  }, {});

  if (loading) return <Loading />;

  return (
    <div className='min-h-screen pt-24 px-6 md:px-16 lg:px-36 pb-12'>
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className='inline-flex items-center gap-2 text-gray-400 hover:text-white 
          transition-colors mb-6'
      >
        <ArrowLeftIcon className='w-5 h-5' />
        Back to Movie
      </button>

      {/* Theatre Header */}
      {theatre && (
        <div className='bg-zinc-900 border border-gray-800 rounded-lg p-8 mb-8'>
          <div className='flex items-start gap-6'>
            <div className='p-4 bg-primary/20 rounded-lg'>
              <TheaterIcon className='w-12 h-12 text-primary' />
            </div>
            <div className='flex-1'>
              <h1 className='text-3xl font-bold mb-3'>{theatre.name}</h1>
              <div className='space-y-2 text-gray-400'>
                <div className='flex items-start gap-2'>
                  <MapPinIcon className='w-5 h-5 mt-0.5' />
                  <p>
                    {theatre.address.street}, {theatre.address.city}, 
                    {theatre.address.state} - {theatre.address.zipCode}
                  </p>
                </div>
                <div className='flex items-center gap-2'>
                  <PhoneIcon className='w-5 h-5' />
                  <p>{theatre.contact.phone}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shows Section */}
      <h2 className='text-2xl font-semibold mb-6'>Available Shows</h2>

      {shows.length > 0 ? (
        <div className='space-y-8'>
          {Object.entries(showsByDate).map(([date, dateShows]) => (
            <div key={date}>
              <h3 className='text-xl font-medium mb-4 text-primary'>{date}</h3>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {dateShows.map((show) => (
                  <Link
                    key={show._id}
                    to={`/book-show/${show._id}`}
                    className='bg-zinc-900 border border-gray-800 rounded-lg overflow-hidden
                      hover:border-primary/50 hover:shadow-xl transition-all group'
                  >
                    {/* Movie Display */}
                    {show.movie && typeof show.movie === 'object' && show.movie.poster_path ? (
                      <img 
                        src={image_base_url + show.movie.poster_path} 
                        alt={show.movie.title}
                        className='w-full h-64 object-cover'
                      />
                    ) : (
                      <div className='w-full h-64 bg-gradient-to-br from-pink-500/20 to-purple-500/20 
                        flex items-center justify-center'>
                        <div className='text-center p-4'>
                          <div className='text-5xl mb-2'>🎬</div>
                          <p className='text-white font-medium'>{show.movieName || show.movie || 'Movie'}</p>
                        </div>
                      </div>
                    )}

                    <div className='p-4'>
                      <h4 className='text-lg font-medium mb-3 truncate group-hover:text-primary transition-colors'>
                        {show.movie?.title || show.movieName || 'Unknown Movie'}
                      </h4>
                      
                      <div className='space-y-2 mb-4'>
                        <div className='flex items-center gap-2 text-sm text-gray-400'>
                          <ClockIcon className='w-4 h-4' />
                          <span>{new Date(show.showDateTime).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}</span>
                        </div>
                        <div className='flex items-center gap-2 text-sm text-gray-400'>
                          <TheaterIcon className='w-4 h-4' />
                          <span>{show.hallName}</span>
                        </div>
                        <div className='flex items-center gap-2 text-sm'>
                          <IndianRupee className='w-4 h-4 text-primary' />
                          <span className='text-primary font-semibold text-lg'>
                            {currency}{show.showPrice}
                          </span>
                        </div>
                      </div>

                      <div className='pt-3 border-t border-gray-700'>
                        <div className='flex items-center justify-between text-xs text-gray-500'>
                          <span>
                            {Object.keys(show.occupiedSeats || {}).length}/{show.totalSeats} seats booked
                          </span>
                          <span className='text-primary group-hover:font-medium'>Book Now →</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className='text-center py-20 bg-zinc-900 border border-gray-800 rounded-lg'>
          <FilmIcon className='w-20 h-20 mx-auto text-gray-600 mb-6' />
          <h3 className='text-2xl font-semibold mb-3'>No Shows Available</h3>
          <p className='text-gray-400 text-lg'>
            This theatre doesn't have any upcoming shows at the moment
          </p>
        </div>
      )}
    </div>
  );
};

export default TheatreShows;
