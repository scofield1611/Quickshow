// File: src/pages/admin/TheatreManagement.jsx

import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import Loading from '../../components/Loading';
import Title from '../../components/admin/title';
import { 
  TheaterIcon, 
  CheckIcon, 
  XIcon, 
  MapPinIcon,
  PhoneIcon,
  MailIcon,
  ClockIcon,
  AlertCircleIcon
} from 'lucide-react';

const TheatreManagement = () => {
  const { axios, getToken } = useAppContext();
  const [theatres, setTheatres] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING_APPROVAL');
  const [selectedTheatre, setSelectedTheatre] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'approve' or 'reject'
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTheatres = async () => {
    try {
      const { data } = await axios.get('/api/admin/theatres', {
        params: { status: filter !== 'ALL' ? filter : undefined },
        headers: { Authorization: `Bearer ${await getToken()}` }
      });

      if (data.success) {
        setTheatres(data.theatres);
      }
    } catch (error) {
      toast.error('Error fetching theatres');
      console.error(error);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await axios.get('/api/admin/theatres/stats', {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });

      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTheatres();
  }, [filter]);

  useEffect(() => {
    fetchStats();
  }, []);

  const openModal = (theatre, type) => {
    setSelectedTheatre(theatre);
    setModalType(type);
    setShowModal(true);
    setRejectionReason('');
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const { data } = await axios.put(
        `/api/admin/theatres/${selectedTheatre._id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (data.success) {
        toast.success('Theatre approved successfully');
        setShowModal(false);
        fetchTheatres();
        fetchStats();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Error approving theatre');
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setActionLoading(true);
    try {
      const { data } = await axios.put(
        `/api/admin/theatres/${selectedTheatre._id}/reject`,
        { reason: rejectionReason },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (data.success) {
        toast.success('Theatre rejected');
        setShowModal(false);
        fetchTheatres();
        fetchStats();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Error rejecting theatre');
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <>
      <Title text1="Theatre" text2="Management" />

      {/* Stats Cards */}
      {stats && (
        <div className='grid grid-cols-2 md:grid-cols-5 gap-4 mt-6'>
          <StatCard title="Total" value={stats.total} color="text-blue-500" />
          <StatCard title="Pending" value={stats.pending} color="text-yellow-500" />
          <StatCard title="Approved" value={stats.approved} color="text-green-500" />
          <StatCard title="Rejected" value={stats.rejected} color="text-red-500" />
          <StatCard title="Active" value={stats.active} color="text-purple-500" />
        </div>
      )}

      {/* Filter Tabs */}
      <div className='flex gap-2 mt-6 overflow-x-auto'>
        {['ALL', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-md whitespace-nowrap transition-colors
              ${filter === status 
                ? 'bg-primary text-white' 
                : 'bg-primary/10 text-gray-400 hover:bg-primary/20'
              }`}
          >
            {status === 'ALL' ? 'All' : 
             status === 'PENDING_APPROVAL' ? 'Pending' : 
             status.charAt(0) + status.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Theatres List */}
      <div className='mt-6 space-y-4'>
        {theatres.length > 0 ? (
          theatres.map((theatre) => (
            <TheatreCard 
              key={theatre._id} 
              theatre={theatre} 
              onApprove={() => openModal(theatre, 'approve')}
              onReject={() => openModal(theatre, 'reject')}
            />
          ))
        ) : (
          <div className='text-center py-12 bg-primary/10 border border-primary/20 rounded-lg'>
            <TheaterIcon className='w-16 h-16 mx-auto text-gray-600 mb-4' />
            <p className='text-gray-400'>No {filter.toLowerCase()} theatres found</p>
          </div>
        )}
      </div>

      {/* Approval/Rejection Modal */}
      {showModal && (
        <div className='fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4'>
          <div className='bg-zinc-900 border border-gray-700 rounded-lg max-w-md w-full p-6'>
            <h3 className='text-xl font-medium mb-4'>
              {modalType === 'approve' ? 'Approve Theatre' : 'Reject Theatre'}
            </h3>
            
            <div className='mb-4'>
              <p className='text-gray-400 mb-2'>Theatre: {selectedTheatre?.name}</p>
              <p className='text-sm text-gray-500'>{selectedTheatre?.address.city}</p>
            </div>

            {modalType === 'reject' && (
              <div className='mb-4'>
                <label className='block text-sm mb-2'>Rejection Reason *</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows='4'
                  className='w-full px-4 py-2 bg-zinc-800 border border-gray-700 
                    rounded-md focus:outline-none focus:border-primary'
                  placeholder='Please provide a reason for rejection...'
                />
              </div>
            )}

            <div className='flex gap-3'>
              <button
                onClick={modalType === 'approve' ? handleApprove : handleReject}
                disabled={actionLoading}
                className={`flex-1 px-4 py-2 rounded-md transition-colors
                  ${modalType === 'approve' 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-red-500 hover:bg-red-600'
                  } disabled:opacity-50`}
              >
                {actionLoading ? 'Processing...' : 
                 modalType === 'approve' ? 'Approve' : 'Reject'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                disabled={actionLoading}
                className='px-4 py-2 bg-zinc-800 hover:bg-zinc-700 
                  rounded-md transition-colors disabled:opacity-50'
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Stat Card Component
const StatCard = ({ title, value, color }) => (
  <div className='bg-primary/10 border border-primary/20 rounded-lg p-4'>
    <p className='text-sm text-gray-400'>{title}</p>
    <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
  </div>
);

// Theatre Card Component
const TheatreCard = ({ theatre, onApprove, onReject }) => {
  const getStatusBadge = (status) => {
    const badges = {
      'APPROVED': 'bg-green-500/20 text-green-500 border-green-500/30',
      'PENDING_APPROVAL': 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
      'REJECTED': 'bg-red-500/20 text-red-500 border-red-500/30'
    };
    
    return (
      <span className={`px-2 py-1 text-xs rounded border ${badges[status]}`}>
        {status === 'PENDING_APPROVAL' ? 'Pending' : status}
      </span>
    );
  };

  return (
    <div className='bg-primary/10 border border-primary/20 rounded-lg p-6'>
      <div className='flex items-start justify-between mb-4'>
        <div className='flex items-center gap-3 flex-1'>
          <div className='p-3 bg-primary/20 rounded-lg'>
            <TheaterIcon className='w-6 h-6 text-primary' />
          </div>
          <div>
            <h3 className='text-lg font-medium'>{theatre.name}</h3>
            <p className='text-sm text-gray-400'>
              Owner: {theatre.owner?.name || 'N/A'}
            </p>
          </div>
        </div>
        {getStatusBadge(theatre.approvalStatus)}
      </div>

      <div className='grid md:grid-cols-2 gap-4 mb-4'>
        <div className='space-y-2'>
          <div className='flex items-start gap-2 text-sm'>
            <MapPinIcon className='w-4 h-4 text-gray-400 mt-0.5' />
            <p className='text-gray-300'>
              {theatre.address.street}, {theatre.address.city}, 
              {theatre.address.state} - {theatre.address.zipCode}
            </p>
          </div>
          <div className='flex items-center gap-2 text-sm'>
            <PhoneIcon className='w-4 h-4 text-gray-400' />
            <p className='text-gray-300'>{theatre.contact.phone}</p>
          </div>
        </div>
        
        <div className='space-y-2'>
          <div className='flex items-center gap-2 text-sm'>
            <MailIcon className='w-4 h-4 text-gray-400' />
            <p className='text-gray-300'>{theatre.contact.email}</p>
          </div>
          <div className='flex items-center gap-2 text-sm'>
            <ClockIcon className='w-4 h-4 text-gray-400' />
            <p className='text-gray-300'>
              {new Date(theatre.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {theatre.rejectionReason && (
        <div className='mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-sm'>
          <p className='text-red-500 font-medium mb-1'>Rejection Reason:</p>
          <p className='text-gray-300'>{theatre.rejectionReason}</p>
        </div>
      )}

      {theatre.approvalStatus === 'PENDING_APPROVAL' && (
        <div className='flex gap-2 pt-4 border-t border-gray-700'>
          <button
            onClick={onApprove}
            className='flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 
              rounded-md transition-colors flex items-center justify-center gap-2'
          >
            <CheckIcon className='w-4 h-4' />
            Approve
          </button>
          <button
            onClick={onReject}
            className='flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 
              rounded-md transition-colors flex items-center justify-center gap-2'
          >
            <XIcon className='w-4 h-4' />
            Reject
          </button>
        </div>
      )}
    </div>
  );
};

export default TheatreManagement;