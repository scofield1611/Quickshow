import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import Loading from '../../components/Loading';
import Title from '../../components/admin/title';
import { 
  TheaterIcon, 
  MapPinIcon, 
  PhoneIcon, 
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  Edit2Icon,
  PlusIcon
} from 'lucide-react';

const MyTheatres = () => {
  const { axios, getToken } = useAppContext();
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const fetchTheatres = async () => {
    try {
      const { data } = await axios.get('/api/theatre/my-theatres', {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });

      if (data.success) {
        setTheatres(data.theatres);
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

  useEffect(() => {
    fetchTheatres();
  }, []);

  const getStatusIcon = (status) => {
    const icons = {
      'APPROVED': <CheckCircleIcon className='w-5 h-5 text-green-500' />,
      'PENDING_APPROVAL': <ClockIcon className='w-5 h-5 text-yellow-500' />,
      'REJECTED': <XCircleIcon className='w-5 h-5 text-red-500' />
    };
    return icons[status];
  };

  const getStatusBadge = (status) => {
    const badges = {
      'APPROVED': 'bg-green-500/20 text-green-500 border-green-500/30',
      'PENDING_APPROVAL': 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
      'REJECTED': 'bg-red-500/20 text-red-500 border-red-500/30'
    };
    
    const labels = {
      'APPROVED': 'Approved',
      'PENDING_APPROVAL': 'Pending Approval',
      'REJECTED': 'Rejected'
    };

    return (
      <span className={`px-3 py-1 text-xs rounded border ${badges[status]} flex items-center gap-1`}>
        {getStatusIcon(status)}
        {labels[status]}
      </span>
    );
  };

  const filteredTheatres = theatres.filter(theatre => {
    if (filter === 'ALL') return true;
    return theatre.approvalStatus === filter;
  });

  if (loading) return <Loading />;

  return (
    <>
      <div className='flex items-center justify-between'>
        <Title text1="My" text2="Theatres" />
        <Link 
          to='/theatre/add-theatre'
          className='px-4 py-2 bg-primary hover:bg-primary/80 rounded-md 
            transition-colors flex items-center gap-2'
        >
          <PlusIcon className='w-4 h-4' />
          Add Theatre
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className='flex gap-2 mt-6 overflow-x-auto'>
        {['ALL', 'APPROVED', 'PENDING_APPROVAL', 'REJECTED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-md whitespace-nowrap transition-colors
              ${filter === status 
                ? 'bg-primary text-white' 
                : 'bg-primary/10 text-gray-400 hover:bg-primary/20'
              }`}
          >
            {status === 'ALL' ? 'All Theatres' : 
             status === 'PENDING_APPROVAL' ? 'Pending' : 
             status.charAt(0) + status.slice(1).toLowerCase()}
            <span className='ml-2'>
              ({theatres.filter(t => status === 'ALL' || t.approvalStatus === status).length})
            </span>
          </button>
        ))}
      </div>

      {/* Theatres List */}
      {filteredTheatres.length > 0 ? (
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6'>
          {filteredTheatres.map((theatre) => (
            <div 
              key={theatre._id}
              className='bg-primary/10 border border-primary/20 rounded-lg p-6
                hover:bg-primary/15 transition-all hover:shadow-lg'
            >
              {/* Header */}
              <div className='flex items-start justify-between mb-4'>
                <div className='flex items-center gap-3 flex-1'>
                  <div className='p-3 bg-primary/20 rounded-lg'>
                    <TheaterIcon className='w-6 h-6 text-primary' />
                  </div>
                  <div>
                    <h3 className='text-lg font-medium'>{theatre.name}</h3>
                    <p className='text-sm text-gray-400'>
                      {theatre.totalHalls || 0} Hall{theatre.totalHalls !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                {getStatusBadge(theatre.approvalStatus)}
              </div>

              {/* Details */}
              <div className='space-y-2 mb-4'>
                <div className='flex items-start gap-2 text-sm'>
                  <MapPinIcon className='w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0' />
                  <p className='text-gray-300'>
                    {theatre.address.street}, {theatre.address.city}, {theatre.address.state} - {theatre.address.zipCode}
                  </p>
                </div>
                <div className='flex items-center gap-2 text-sm'>
                  <PhoneIcon className='w-4 h-4 text-gray-400' />
                  <p className='text-gray-300'>{theatre.contact.phone}</p>
                </div>
              </div>

              {/* Rejection Reason */}
              {theatre.approvalStatus === 'REJECTED' && theatre.rejectionReason && (
                <div className='mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-sm'>
                  <p className='text-red-500 font-medium mb-1'>Rejection Reason:</p>
                  <p className='text-gray-300'>{theatre.rejectionReason}</p>
                </div>
              )}

              {/* Actions */}
              <div className='flex gap-2 pt-4 border-t border-gray-700'>
                <Link 
                  to={`/theatre/manage-shows/${theatre._id}`}
                  className={`flex-1 px-4 py-2 rounded-md transition-colors text-center text-sm
                    ${theatre.approvalStatus === 'APPROVED'
                      ? 'bg-primary hover:bg-primary/80'
                      : 'bg-gray-700 cursor-not-allowed opacity-50'
                    }`}
                  onClick={(e) => {
                    if (theatre.approvalStatus !== 'APPROVED') {
                      e.preventDefault();
                      toast.error('Theatre must be approved to manage shows');
                    }
                  }}
                >
                  Manage Shows
                </Link>
                <Link 
                  to={`/theatre/edit/${theatre._id}`}
                  className='px-4 py-2 bg-primary/20 hover:bg-primary/30 border 
                    border-primary/30 rounded-md transition-colors flex items-center gap-2'
                >
                  <Edit2Icon className='w-4 h-4' />
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className='text-center py-12 mt-6'>
          <TheaterIcon className='w-16 h-16 mx-auto text-gray-600 mb-4' />
          <h3 className='text-xl font-medium mb-2'>
            No {filter !== 'ALL' && `${filter.toLowerCase()} `}theatres found
          </h3>
          <p className='text-gray-400 mb-6'>
            {filter === 'ALL' 
              ? 'Get started by adding your first theatre'
              : `You don't have any ${filter.toLowerCase()} theatres`
            }
          </p>
          {filter === 'ALL' && (
            <Link 
              to='/theatre/add-theatre'
              className='inline-flex items-center gap-2 px-6 py-3 bg-primary 
                hover:bg-primary/80 rounded-md transition-colors'
            >
              <PlusIcon className='w-5 h-5' />
              Add Your First Theatre
            </Link>
          )}
        </div>
      )}
    </>
  );
};

export default MyTheatres;
