import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import Title from '../../components/admin/Title';
import Loading from '../../components/Loading';
import { TheaterIcon, FilmIcon, MapPinIcon, CalendarIcon, DollarSignIcon, LayoutGridIcon } from 'lucide-react';

const AddShow = () => {
  const { theatreId } = useParams(); // Optional - if coming from ManageShows
  const { axios, getToken } = useAppContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [movies, setMovies] = useState([]);
  const [approvedTheatres, setApprovedTheatres] = useState([]);
  
  const [formData, setFormData] = useState({
    theatre: theatreId || '', // Pre-select if coming from ManageShows
    movie: '',
    hallName: '',
    showDateTime: '',
    showPrice: '',
    seatConfiguration: {
      rows: 10,
      seatsPerRow: 15
    }
  });

  // Fetch approved theatres owned by the user
  const fetchApprovedTheatres = async () => {
    try {
      const { data } = await axios.get('/api/theatre/my-theatres', {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });

      if (data.success) {
        // Filter only approved theatres
        const approved = data.theatres.filter(t => t.approvalStatus === 'APPROVED');
        setApprovedTheatres(approved);
        
        if (approved.length === 0) {
          toast.error('You need at least one approved theatre to create shows');
        }
      }
    } catch (error) {
      toast.error('Error fetching theatres');
      console.error(error);
    }
  };

  // Fetch available movies
  const fetchMovies = async () => {
    try {
      const { data } = await axios.get('/api/shows/movies');
      if (data.success) {
        setMovies(data.movies || []);
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
      toast.error('Could not load movies');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    Promise.all([fetchApprovedTheatres(), fetchMovies()]);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: parseInt(value) || value
        }
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        [name]: name === 'showPrice' ? parseFloat(value) || '' : value 
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.theatre) {
      toast.error('Please select a theatre');
      return;
    }

    if (approvedTheatres.length === 0) {
      toast.error('No approved theatres available');
      return;
    }

    setLoading(true);

    try {
      const { data } = await axios.post(
        `/api/theatre/${formData.theatre}/shows`,
        {
          movie: formData.movie,
          hallName: formData.hallName,
          showDateTime: formData.showDateTime,
          showPrice: formData.showPrice,
          seatConfiguration: formData.seatConfiguration
        },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (data.success) {
        toast.success('Show created successfully!');
        navigate(`/theatre/manage-shows/${formData.theatre}`);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating show');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const totalSeats = formData.seatConfiguration.rows * formData.seatConfiguration.seatsPerRow;

  if (loadingData) return <Loading />;

  // Check if user has any approved theatres
  if (approvedTheatres.length === 0) {
    return (
      <>
        <Title text1="Add" text2="Show" />
        <div className='text-center py-12 mt-6 bg-primary/10 border border-primary/20 rounded-lg max-w-2xl'>
          <TheaterIcon className='w-16 h-16 mx-auto text-gray-600 mb-4' />
          <h3 className='text-xl font-medium mb-2'>No Approved Theatres</h3>
          <p className='text-gray-400 mb-6'>
            You need to have at least one approved theatre to create shows
          </p>
          <button
            onClick={() => navigate('/theatre/add-theatre')}
            className='px-6 py-3 bg-primary hover:bg-primary/80 rounded-md transition-colors'
          >
            Add Your First Theatre
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Title text1="Add New" text2="Show" />

      <form onSubmit={handleSubmit} className='max-w-2xl mt-8 space-y-6'>
        
        {/* Theatre Selection */}
        <div className='bg-primary/10 border border-primary/20 rounded-lg p-6'>
          <h3 className='text-lg font-medium mb-4 flex items-center gap-2'>
            <TheaterIcon className='w-5 h-5 text-primary' />
            Select Theatre
          </h3>
          
          <div>
            <label className='block text-sm mb-2'>Theatre *</label>
            <select
              name='theatre'
              value={formData.theatre}
              onChange={handleChange}
              required
              disabled={!!theatreId} // Disable if coming from specific theatre
              className='w-full px-4 py-2 bg-zinc-900 border border-gray-700 
                rounded-md focus:outline-none focus:border-primary disabled:opacity-50'
            >
              <option value=''>Select a theatre</option>
              {approvedTheatres.map((theatre) => (
                <option key={theatre._id} value={theatre._id}>
                  {theatre.name} - {theatre.address.city}
                </option>
              ))}
            </select>
            <p className='text-xs text-gray-500 mt-2'>
              Only your approved theatres are shown
            </p>
          </div>
        </div>

        {/* Movie Selection */}
        <div className='bg-primary/10 border border-primary/20 rounded-lg p-6'>
          <h3 className='text-lg font-medium mb-4 flex items-center gap-2'>
            <FilmIcon className='w-5 h-5 text-primary' />
            Movie Details
          </h3>
          
          <div>
            <label className='block text-sm mb-2'>Select Movie *</label>
            <select
              name='movie'
              value={formData.movie}
              onChange={handleChange}
              required
              className='w-full px-4 py-2 bg-zinc-900 border border-gray-700 
                rounded-md focus:outline-none focus:border-primary'
            >
              <option value=''>Choose a movie</option>
              {movies.map((movie) => (
                <option key={movie._id} value={movie._id}>
                  {movie.title} ({movie.release_date?.slice(0, 4)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Hall & Show Details */}
        <div className='bg-primary/10 border border-primary/20 rounded-lg p-6'>
          <h3 className='text-lg font-medium mb-4 flex items-center gap-2'>
            <MapPinIcon className='w-5 h-5 text-primary' />
            Hall & Show Details
          </h3>
          
          <div className='space-y-4'>
            <div>
              <label className='block text-sm mb-2'>Hall/Auditorium Name *</label>
              <input
                type='text'
                name='hallName'
                value={formData.hallName}
                onChange={handleChange}
                required
                className='w-full px-4 py-2 bg-zinc-900 border border-gray-700 
                  rounded-md focus:outline-none focus:border-primary'
                placeholder='e.g., Screen 1, Audi 1, Gold Class, IMAX'
              />
            </div>

            <div>
              <label className='block text-sm mb-2 flex items-center gap-2'>
                <CalendarIcon className='w-4 h-4' />
                Show Date & Time *
              </label>
              <input
                type='datetime-local'
                name='showDateTime'
                value={formData.showDateTime}
                onChange={handleChange}
                required
                min={new Date().toISOString().slice(0, 16)}
                className='w-full px-4 py-2 bg-zinc-900 border border-gray-700 
                  rounded-md focus:outline-none focus:border-primary'
              />
            </div>

            <div>
              <label className='block text-sm mb-2 flex items-center gap-2'>
                <DollarSignIcon className='w-4 h-4' />
                Ticket Price (₹) *
              </label>
              <input
                type='number'
                name='showPrice'
                value={formData.showPrice}
                onChange={handleChange}
                required
                min='0'
                step='0.01'
                className='w-full px-4 py-2 bg-zinc-900 border border-gray-700 
                  rounded-md focus:outline-none focus:border-primary'
                placeholder='250'
              />
            </div>
          </div>
        </div>

        {/* Seat Configuration */}
        <div className='bg-primary/10 border border-primary/20 rounded-lg p-6'>
          <h3 className='text-lg font-medium mb-4 flex items-center gap-2'>
            <LayoutGridIcon className='w-5 h-5 text-primary' />
            Seat Configuration
          </h3>
          
          <div className='grid grid-cols-2 gap-4 mb-4'>
            <div>
              <label className='block text-sm mb-2'>Number of Rows *</label>
              <input
                type='number'
                name='seatConfiguration.rows'
                value={formData.seatConfiguration.rows}
                onChange={handleChange}
                required
                min='1'
                max='50'
                className='w-full px-4 py-2 bg-zinc-900 border border-gray-700 
                  rounded-md focus:outline-none focus:border-primary'
              />
            </div>

            <div>
              <label className='block text-sm mb-2'>Seats per Row *</label>
              <input
                type='number'
                name='seatConfiguration.seatsPerRow'
                value={formData.seatConfiguration.seatsPerRow}
                onChange={handleChange}
                required
                min='1'
                max='50'
                className='w-full px-4 py-2 bg-zinc-900 border border-gray-700 
                  rounded-md focus:outline-none focus:border-primary'
              />
            </div>
          </div>

          {/* Total Seats Display */}
          <div className='flex items-center justify-between p-4 bg-zinc-900 rounded-md border border-gray-700'>
            <span className='text-sm text-gray-400'>Total Seats:</span>
            <span className='text-2xl font-bold text-primary'>{totalSeats}</span>
          </div>

          <p className='text-xs text-gray-500 mt-3'>
            Preview: {formData.seatConfiguration.rows} rows × {formData.seatConfiguration.seatsPerRow} seats = {totalSeats} total seats
          </p>
        </div>

        {/* Submit Buttons */}
        <div className='flex gap-4'>
          <button
            type='submit'
            disabled={loading || approvedTheatres.length === 0}
            className='px-8 py-3 bg-primary hover:bg-primary/80 rounded-md 
              transition-colors disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center gap-2'
          >
            {loading ? (
              <>
                <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                Creating...
              </>
            ) : (
              'Create Show'
            )}
          </button>
          <button
            type='button'
            onClick={() => navigate('/theatre/my-theatres')}
            className='px-8 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors'
          >
            Cancel
          </button>
        </div>

        <p className='text-sm text-gray-400 mt-4'>
          * All fields marked with asterisk are required
        </p>
      </form>
    </>
  );
};

export default AddShow;
