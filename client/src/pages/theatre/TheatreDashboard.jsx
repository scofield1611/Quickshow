import React, { useEffect, useState } from 'react';
import { 
  TheaterIcon, 
  PlayCircleIcon, 
  ClockIcon, 
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import Loading from '../../components/Loading';
import Title from '../../components/admin/title';
import BlurCircle from '../../components/Blurcircle';
import { Link } from 'react-router-dom';

const TheatreDashboard = () => {
  const { axios, getToken } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTheatres: 0,
    approvedTheatres: 0,
    pendingTheatres: 0,
    rejectedTheatres: 0,
    totalShows: 0,
  });
  const [recentTheatres, setRecentTheatres] = useState([]);

  const fetchDashboardData = async () => {
    try {
      const { data } = await axios.get('/api/theatre/my-theatres', {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });

      if (data.success) {
        const theatres = data.theatres;
        setRecentTheatres(theatres.slice(0, 5));
        
        setStats({
          totalTheatres: theatres.length,
          approvedTheatres: theatres.filter(t => t.approvalStatus === 'APPROVED').length,
          pendingTheatres: theatres.filter(t => t.approvalStatus === 'PENDING_APPROVAL').length,
          rejectedTheatres: theatres.filter(t => t.approvalStatus === 'REJECTED').length,
          totalShows: theatres.reduce((acc, t) => acc + (t.totalHalls || 0), 0),
        });
      }
    } catch (error) {
      toast.error('Error fetching dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const dashboardCards = [
    { 
      title: "Total Theatres", 
      value: stats.totalTheatres, 
      icon: TheaterIcon,
      color: "text-blue-500"
    },
    { 
      title: "Approved", 
      value: stats.approvedTheatres, 
      icon: CheckCircleIcon,
      color: "text-green-500"
    },
    { 
      title: "Pending Approval", 
      value: stats.pendingTheatres, 
      icon: ClockIcon,
      color: "text-yellow-500"
    },
    { 
      title: "Total Halls", 
      value: stats.totalShows, 
      icon: PlayCircleIcon,
      color: "text-purple-500"
    }
  ];

  const getStatusBadge = (status) => {
    const badges = {
      'APPROVED': 'bg-green-500/20 text-green-500 border-green-500/30',
      'PENDING_APPROVAL': 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
      'REJECTED': 'bg-red-500/20 text-red-500 border-red-500/30'
    };
    
    const labels = {
      'APPROVED': 'Approved',
      'PENDING_APPROVAL': 'Pending',
      'REJECTED': 'Rejected'
    };

    return (
      <span className={`px-2 py-1 text-xs rounded border ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (loading) return <Loading />;

  return (
    <>
      <Title text1="Theatre Owner" text2="Dashboard" />

      {/* Stats Cards */}
      <div className='relative flex flex-wrap gap-4 mt-6'>
        <BlurCircle top='-100px' left='0' />
        <div className='flex flex-wrap gap-4 w-full'>
          {dashboardCards.map((card, index) => (
            <div 
              key={index} 
              className='flex items-center justify-between px-4 py-3 
                bg-primary/10 border border-primary/20 rounded-md min-w-[200px] flex-1'
            >
              <div>
                <h1 className='text-sm text-gray-400'>{card.title}</h1>
                <p className='text-2xl font-medium mt-1'>{card.value}</p>
              </div>
              <card.icon className={`w-8 h-8 ${card.color}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className='mt-8'>
        <h2 className='text-lg font-medium mb-4'>Quick Actions</h2>
        <div className='flex flex-wrap gap-4'>
          <Link 
            to='/theatre/add-theatre'
            className='px-6 py-3 bg-primary hover:bg-primary/80 
              rounded-md transition-colors flex items-center gap-2'
          >
            <TheaterIcon className='w-5 h-5' />
            Add New Theatre
          </Link>
          <Link 
            to='/theatre/my-theatres'
            className='px-6 py-3 bg-primary/20 hover:bg-primary/30 border 
              border-primary/30 rounded-md transition-colors'
          >
            View All Theatres
          </Link>
        </div>
      </div>

      {/* Recent Theatres */}
      {recentTheatres.length > 0 && (
        <div className='mt-8'>
          <h2 className='text-lg font-medium mb-4'>Your Theatres</h2>
          <div className='space-y-4'>
            {recentTheatres.map((theatre) => (
              <div 
                key={theatre._id}
                className='bg-primary/10 border border-primary/20 rounded-lg p-4
                  hover:bg-primary/15 transition-colors'
              >
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-3 mb-2'>
                      <h3 className='text-lg font-medium'>{theatre.name}</h3>
                      {getStatusBadge(theatre.approvalStatus)}
                    </div>
                    <p className='text-sm text-gray-400'>
                      {theatre.address.street}, {theatre.address.city}, {theatre.address.state}
                    </p>
                    <div className='flex items-center gap-4 mt-3 text-sm'>
                      <span className='flex items-center gap-1'>
                        <PlayCircleIcon className='w-4 h-4' />
                        {theatre.totalHalls || 0} Halls
                      </span>
                      <span className='text-gray-500'>
                        {theatre.contact.phone}
                      </span>
                    </div>
                    {theatre.approvalStatus === 'REJECTED' && theatre.rejectionReason && (
                      <div className='mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded text-sm'>
                        <p className='text-red-500 font-medium mb-1'>Rejection Reason:</p>
                        <p className='text-gray-300'>{theatre.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                  <Link 
                    to={`/theatre/my-theatres/${theatre._id}`}
                    className='px-4 py-2 bg-primary/20 hover:bg-primary/30 
                      rounded border border-primary/30 transition-colors text-sm'
                  >
                    Manage
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {recentTheatres.length === 0 && (
        <div className='mt-12 text-center py-12'>
          <TheaterIcon className='w-16 h-16 mx-auto text-gray-600 mb-4' />
          <h3 className='text-xl font-medium mb-2'>No Theatres Yet</h3>
          <p className='text-gray-400 mb-6'>Get started by adding your first theatre</p>
          <Link 
            to='/theatre/add-theatre'
            className='inline-flex items-center gap-2 px-6 py-3 bg-primary 
              hover:bg-primary/80 rounded-md transition-colors'
          >
            <TheaterIcon className='w-5 h-5' />
            Add Your First Theatre
          </Link>
        </div>
      )}
    </>
  );
};

export default TheatreDashboard;
