import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';
import Loading from '../components/Loading';
import {
  TheaterIcon,
  MapPinIcon,
  PhoneIcon,
  SearchIcon,
  ChevronRightIcon,
  ArrowLeftIcon
} from 'lucide-react';

const Theatres = () => {
  const { axios } = useAppContext();
  const navigate = useNavigate();
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState('');
  const [filteredTheatres, setFilteredTheatres] = useState([]);
  const [theatreShowCounts, setTheatreShowCounts] = useState({});

  const fetchApprovedTheatres = async () => {
    try {
      const { data } = await axios.get('/api/theatre/approved');

      if (data.success) {
        setTheatres(data.theatres);
        setFilteredTheatres(data.theatres);
        // Fetch show counts for each theatre
        fetchShowCounts(data.theatres);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Error fetching theatres');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchShowCounts = async (theatresList) => {
    try {
      // Fetch shows for each theatre
      const showCountPromises = theatresList.map(async (theatre) => {
        try {
          const { data } = await axios.get(`/api/theatre/${theatre._id}/shows`);
          // Count only future shows
          const futureShows = data.shows?.filter(show => 
            new Date(show.showDateTime) >= new Date()
          ) || [];
          return { theatreId: theatre._id, count: futureShows.length };
        } catch (error) {
          console.error(`Error fetching shows for ${theatre.name}:`, error);
          return { theatreId: theatre._id, count: 0 };
        }
      });

      const counts = await Promise.all(showCountPromises);
      const countsMap = counts.reduce((acc, { theatreId, count }) => {
        acc[theatreId] = count;
        return acc;
      }, {});
      
      setTheatreShowCounts(countsMap);
    } catch (error) {
      console.error('Error fetching show counts:', error);
    }
  };

  useEffect(() => {
    fetchApprovedTheatres();
  }, []);

  useEffect(() => {
    if (searchCity.trim() === '') {
      setFilteredTheatres(theatres);
    } else {
      const filtered = theatres.filter(theatre =>
        theatre.address.city.toLowerCase().includes(searchCity.toLowerCase()) ||
        theatre.address.state.toLowerCase().includes(searchCity.toLowerCase()) ||
        theatre.name.toLowerCase().includes(searchCity.toLowerCase())
      );
      setFilteredTheatres(filtered);
    }
  }, [searchCity, theatres]);

  // Group theatres by city
  const theatresByCity = filteredTheatres.reduce((acc, theatre) => {
    const city = theatre.address.city;
    if (!acc[city]) {
      acc[city] = [];
    }
    acc[city].push(theatre);
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
        Back
      </button>

      {/* Header */}
      <div className='text-center mb-12'>
        <h1 className='text-4xl md:text-5xl font-bold mb-4'>
          Browse <span className='text-primary'>Theatres</span>
        </h1>
        <p className='text-gray-400 text-lg'>
          Discover theatres near you and book your favorite movies
        </p>
      </div>

      {/* Search Bar */}
      <div className='max-w-2xl mx-auto mb-12'>
        <div className='relative'>
          <SearchIcon className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
          <input
            type='text'
            placeholder='Search by city, state, or theatre name...'
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            className='w-full pl-12 pr-4 py-3 bg-zinc-900 border border-gray-700 
              rounded-full focus:outline-none focus:border-primary text-white'
          />
        </div>
      </div>

      {/* Theatres List */}
      {Object.keys(theatresByCity).length > 0 ? (
        <div className='space-y-12'>
          {Object.entries(theatresByCity).map(([city, cityTheatres]) => (
            <div key={city}>
              <h2 className='text-2xl font-semibold mb-6 flex items-center gap-2'>
                <MapPinIcon className='w-6 h-6 text-primary' />
                {city}
                <span className='text-sm text-gray-400 font-normal'>
                  ({cityTheatres.length} theatre{cityTheatres.length !== 1 ? 's' : ''})
                </span>
              </h2>

              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {cityTheatres.map((theatre) => {
                  const showCount = theatreShowCounts[theatre._id] || 0;
                  const hasShows = showCount > 0;

                  return (
                    <Link
                      key={theatre._id}
                      to={`/theatre/${theatre._id}/shows`}
                      className='bg-zinc-900 border border-gray-800 rounded-lg p-6
                        hover:border-primary/50 hover:bg-zinc-800 transition-all
                        hover:shadow-xl hover:-translate-y-1 group relative'
                    >
                      {/* Show Availability Badge */}
                      <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium ${
                        hasShows 
                          ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                          : 'bg-red-500/20 border border-red-500/50 text-red-400'
                      }`}>
                        {hasShows ? `${showCount} Show${showCount !== 1 ? 's' : ''} Available` : 'No Shows'}
                      </div>

                      <div className='flex items-start justify-between mb-4'>
                        <div className='flex items-center gap-3'>
                          <div className='p-3 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition-colors'>
                            <TheaterIcon className='w-6 h-6 text-primary' />
                          </div>
                          <div>
                            <h3 className='text-lg font-semibold group-hover:text-primary transition-colors'>
                              {theatre.name}
                            </h3>
                            <p className='text-sm text-gray-400'>
                              {theatre.totalHalls || 0} Screen{theatre.totalHalls !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <ChevronRightIcon className='w-5 h-5 text-gray-600 group-hover:text-primary
                          group-hover:translate-x-1 transition-all' />
                      </div>

                      <div className='space-y-2'>
                        <div className='flex items-start gap-2 text-sm text-gray-400'>
                          <MapPinIcon className='w-4 h-4 mt-0.5 flex-shrink-0' />
                          <p className='line-clamp-2'>
                            {theatre.address.street}, {theatre.address.city}, {theatre.address.state}
                          </p>
                        </div>
                        <div className='flex items-center gap-2 text-sm text-gray-400'>
                          <PhoneIcon className='w-4 h-4' />
                          <p>{theatre.contact.phone}</p>
                        </div>
                      </div>

                      <div className='mt-4 pt-4 border-t border-gray-700 flex items-center justify-between'>
                        <span className='text-sm text-gray-500'>View Shows</span>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          hasShows 
                            ? 'bg-primary/20 text-primary'
                            : 'bg-gray-700 text-gray-400'
                        }`}>
                          {hasShows ? 'Book Now' : 'Coming Soon'}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className='text-center py-20'>
          <TheaterIcon className='w-20 h-20 mx-auto text-gray-600 mb-6' />
          <h3 className='text-2xl font-semibold mb-3'>No Theatres Found</h3>
          <p className='text-gray-400 text-lg'>
            {searchCity ? `No theatres found matching "${searchCity}"` : 'No approved theatres available yet'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Theatres;
