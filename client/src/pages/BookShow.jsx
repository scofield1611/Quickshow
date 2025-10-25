import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Loading from '../components/Loading';
import { ArrowRightIcon, ArrowLeftIcon, FilmIcon, TheaterIcon, CalendarIcon, DollarSignIcon, ClockIcon } from 'lucide-react';
import { assets } from '../assets/assets';
import toast from 'react-hot-toast';
import { useAppContext } from '../context/AppContext';
import dateFormat from '../lib/dateFormat';

const BookShow = () => {
  const { showId } = useParams();
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [show, setShow] = useState(null);
  const [allShows, setAllShows] = useState([]);
  const [occupiedSeats, setOccupiedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { axios, getToken, user, image_base_url } = useAppContext();
  const currency = import.meta.env.VITE_CURRENCY;

  const handleSeatClick = (seatId) => {
    if (selectedSeats.length >= 5 && !selectedSeats.includes(seatId)) {
      return toast.error("You can select a maximum of 5 seats");
    }
    setSelectedSeats(prev => prev.includes(seatId) ?
      prev.filter(seat => seat !== seatId) : [...prev, seatId]);
  };

  const handleShowTimeChange = (newShowId) => {
    if (selectedSeats.length > 0) {
      if (!confirm('Changing show time will clear your selected seats. Continue?')) {
        return;
      }
    }
    navigate(`/book-show/${newShowId}`);
  };

  const formatTime = (dateTime) => {
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateTime) => {
    const date = new Date(dateTime);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderSeats = () => {
    const rows = show.seatConfiguration.rows;
    const seatsPerRow = show.seatConfiguration.seatsPerRow;
    const rowLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    return (
      <div className='space-y-2'>
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div key={rowIndex} className='flex gap-2 justify-center'>
            <span className='w-6 text-center text-gray-400 text-sm'>
              {rowLabels[rowIndex]}
            </span>
            {Array.from({ length: seatsPerRow }, (_, seatIndex) => {
              const seatId = `${rowLabels[rowIndex]}${seatIndex + 1}`;
              const isOccupied = occupiedSeats.includes(seatId);
              const isSelected = selectedSeats.includes(seatId);

              return (
                <button
                  key={seatId}
                  onClick={() => handleSeatClick(seatId)}
                  disabled={isOccupied}
                  className={`w-8 h-8 rounded border text-xs transition-colors ${
                    isSelected
                      ? "bg-primary text-white border-primary"
                      : isOccupied
                      ? "bg-gray-700 text-gray-500 cursor-not-allowed border-gray-600"
                      : "border-primary/60 cursor-pointer hover:bg-primary/20"
                  }`}
                >
                  {seatIndex + 1}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const getShowDetails = async () => {
    try {
      const { data } = await axios.get(`/api/theatre/show/${showId}`);
      console.log('Show details:', data);

      if (data.success) {
        setShow(data.show);
        // Fetch other shows for same movie at same theatre
        if (data.show.movie && data.show.theatre) {
          getAvailableShows(data.show.theatre._id, data.show.movie._id || data.show.movie);
        }
      } else {
        toast.error('Show not found');
        navigate(-1);
      }
    } catch (error) {
      console.error('Error loading show:', error);
      toast.error('Error loading show');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableShows = async (theatreId, movieId) => {
    try {
      const { data } = await axios.get(`/api/booking/shows`, {
        params: { theatreId, movieId }
      });

      if (data.success) {
        setAllShows(data.shows || []);
        console.log('Available shows:', data.shows);
      }
    } catch (error) {
      console.error('Error loading available shows:', error);
    }
  };

  const getOccupiedSeats = async () => {
    try {
      const { data } = await axios.get(`/api/booking/seats/${showId}`);
      if (data.success) {
        setOccupiedSeats(data.occupiedSeats);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const bookTickets = async () => {
    try {
      if (!user) return toast.error('Please login to proceed');
      if (!selectedSeats.length) {
        return toast.error('Please select at least one seat');
      }
      
      const { data } = await axios.post('/api/booking/create', {
        showId: showId,
        selectedSeats
      }, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });
      
      if (data.success) {
        window.location.href = data.url;
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Booking failed');
    }
  };

  useEffect(() => {
    setSelectedSeats([]); // Clear seats when show changes
    getShowDetails();
    getOccupiedSeats();
  }, [showId]);

  if (loading) return <Loading />;
  if (!show) return <div className='flex items-center justify-center h-screen'>Show not found</div>;

  return (
    <div className='min-h-screen pt-24 px-6 md:px-16 lg:px-36 pb-12'>
      <button
        onClick={() => navigate(-1)}
        className='flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors'
      >
        <ArrowLeftIcon className='w-5 h-5' />
        Back
      </button>

      {/* Show Details Header */}
      <div className='bg-zinc-900 border border-gray-800 rounded-lg p-6 mb-8'>
        <div className='flex gap-6'>
          {show.movie && typeof show.movie === 'object' && show.movie.poster_path ? (
            <img 
              src={image_base_url + show.movie.poster_path}
              alt={show.movie.title}
              className='w-32 h-48 object-cover rounded-lg'
            />
          ) : (
            <div className='w-32 h-48 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-lg flex items-center justify-center'>
              <div className='text-center p-2'>
                <div className='text-4xl mb-1'>🎬</div>
                <p className='text-xs text-white font-medium'>{show.movieName || show.movie || 'Movie'}</p>
              </div>
            </div>
          )}
          
          <div className='flex-1'>
            <h1 className='text-2xl font-bold mb-4'>
              {show.movie?.title || show.movieName || 'Movie'}
            </h1>
            <div className='space-y-2 text-gray-400'>
              <div className='flex items-center gap-2'>
                <TheaterIcon className='w-4 h-4' />
                <span>{show.theatre?.name || 'Theatre'} - {show.hallName}</span>
              </div>
              <div className='flex items-center gap-2'>
                <CalendarIcon className='w-4 h-4' />
                <span>{dateFormat(show.showDateTime)}</span>
              </div>
              <div className='flex items-center gap-2'>
                <DollarSignIcon className='w-4 h-4 text-primary' />
                <span className='text-primary font-semibold text-lg'>
                  {currency}{show.showPrice}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Available Show Timings */}
      {allShows.length > 0 && (
        <div className='mb-8'>
          <div className='flex items-center gap-2 mb-4'>
            <ClockIcon className='w-5 h-5 text-primary' />
            <h2 className='text-xl font-semibold'>Available Show Timings</h2>
          </div>
          
          <div className='bg-zinc-900 border border-gray-800 rounded-lg p-4'>
            {/* Group shows by date */}
            {Object.entries(
              allShows.reduce((acc, s) => {
                const date = formatDate(s.showDateTime);
                if (!acc[date]) acc[date] = [];
                acc[date].push(s);
                return acc;
              }, {})
            ).map(([date, showsOnDate]) => (
              <div key={date} className='mb-4 last:mb-0'>
                <p className='text-sm text-gray-400 mb-3 font-medium'>{date}</p>
                <div className='flex flex-wrap gap-3'>
                  {showsOnDate
                    .sort((a, b) => new Date(a.showDateTime) - new Date(b.showDateTime))
                    .map((s) => {
                      const isCurrentShow = s._id === showId;
                      const availableSeats = s.totalSeats - Object.keys(s.occupiedSeats || {}).length;
                      const isSoldOut = availableSeats === 0;
                      
                      return (
                        <button
                          key={s._id}
                          onClick={() => !isCurrentShow && !isSoldOut && handleShowTimeChange(s._id)}
                          disabled={isSoldOut}
                          className={`px-4 py-2 rounded-lg border transition-all ${
                            isCurrentShow
                              ? 'bg-primary border-primary text-white font-medium'
                              : isSoldOut
                              ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                              : 'border-gray-700 hover:border-primary hover:bg-primary/10 cursor-pointer'
                          }`}
                        >
                          <div className='flex flex-col items-center'>
                            <span className='text-sm font-medium'>
                              {formatTime(s.showDateTime)}
                            </span>
                            <span className='text-xs text-gray-400 mt-1'>
                              {isSoldOut ? 'Sold Out' : `${availableSeats} seats`}
                            </span>
                            {s.hallName !== show.hallName && (
                              <span className='text-xs text-gray-500 mt-0.5'>
                                {s.hallName}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
          
          <p className='text-xs text-gray-500 mt-2'>
            * Click on a time slot to switch shows. Selected seats will be cleared.
          </p>
        </div>
      )}

      {/* Seat Selection */}
      <div className='flex flex-col items-center'>
        <h2 className='text-2xl font-semibold mb-6'>Select Your Seats</h2>
        <img src={assets.screenImage} alt="screen" className='mb-2' />
        <p className='text-gray-400 text-sm mb-8'>SCREEN SIDE</p>
        
        {show.seatConfiguration && renderSeats()}

        {/* Legend */}
        <div className='flex gap-6 mt-8 text-sm'>
          <div className='flex items-center gap-2'>
            <div className='w-6 h-6 border border-primary/60 rounded'></div>
            <span>Available</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-6 h-6 bg-primary rounded'></div>
            <span>Selected</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-6 h-6 bg-gray-700 rounded'></div>
            <span>Occupied</span>
          </div>
        </div>

        {/* Selected Seats Info */}
        {selectedSeats.length > 0 && (
          <div className='mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg'>
            <p className='text-sm text-gray-400 mb-2'>Selected Seats:</p>
            <p className='font-medium'>{selectedSeats.join(', ')}</p>
            <p className='text-lg font-bold text-primary mt-2'>
              Total: {currency}{show.showPrice * selectedSeats.length}
            </p>
          </div>
        )}

        <button 
          onClick={bookTickets}
          disabled={selectedSeats.length === 0}
          className='flex items-center gap-2 mt-8 px-10 py-3 bg-primary 
            hover:bg-primary/90 transition rounded font-medium cursor-pointer 
            active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          Proceed To Checkout
          <ArrowRightIcon strokeWidth={3} className='w-4 h-4' />
        </button>
      </div>
    </div>
  );
};

export default BookShow;
