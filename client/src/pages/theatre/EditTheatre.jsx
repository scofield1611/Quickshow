import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import Title from '../../components/admin/Title';
import { TheaterIcon, MapPinIcon, PhoneIcon, MailIcon, FileTextIcon, ArrowLeftIcon } from 'lucide-react';
import Loading from '../../components/Loading';

const EditTheatre = () => {
  const { theatreId } = useParams();
  const { axios, getToken } = useAppContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India'
    },
    contact: {
      phone: '',
      email: ''
    },
    policies: {
      cancellationPolicy: '',
      refundPolicy: '',
      otherPolicies: ''
    },
    isActive: true
  });

  const fetchTheatreDetails = async () => {
    try {
      const { data } = await axios.get(`/api/theatre/${theatreId}`, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });

      if (data.success) {
        const theatre = data.theatre;
        setFormData({
          name: theatre.name,
          address: theatre.address,
          contact: theatre.contact,
          policies: theatre.policies || {},
          isActive: theatre.isActive
        });
      } else {
        toast.error('Theatre not found');
        navigate('/theatre/my-theatres');
      }
    } catch (error) {
      toast.error('Error loading theatre');
      console.error(error);
      navigate('/theatre/my-theatres');
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchTheatreDetails();
  }, [theatreId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? checked : value 
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await axios.put(`/api/theatre/${theatreId}`, formData, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });

      if (data.success) {
        toast.success('Theatre updated successfully!');
        navigate('/theatre/my-theatres');
      } else {
        toast.error(data.message || 'Failed to update theatre');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating theatre');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) return <Loading />;

  return (
    <>
      <div className='flex items-center gap-4 mb-6'>
        <button
          onClick={() => navigate('/theatre/my-theatres')}
          className='p-2 hover:bg-primary/10 rounded-lg transition-colors'
        >
          <ArrowLeftIcon className='w-5 h-5' />
        </button>
        <Title text1="Edit" text2="Theatre" />
      </div>
      
      <form onSubmit={handleSubmit} className='max-w-3xl'>
        {/* Basic Information */}
        <div className='bg-primary/10 border border-primary/20 rounded-lg p-6 mb-6'>
          <h3 className='text-lg font-medium mb-4 flex items-center gap-2'>
            <TheaterIcon className='w-5 h-5' />
            Basic Information
          </h3>
          
          <div className='space-y-4'>
            <div>
              <label className='block text-sm mb-2'>Theatre Name *</label>
              <input
                type='text'
                name='name'
                value={formData.name}
                onChange={handleChange}
                required
                className='w-full px-4 py-2 bg-zinc-900 border border-gray-700 
                  rounded-md focus:outline-none focus:border-primary'
              />
            </div>

            <div className='flex items-center gap-3'>
              <input
                type='checkbox'
                name='isActive'
                checked={formData.isActive}
                onChange={handleChange}
                id='isActive'
                className='w-4 h-4'
              />
              <label htmlFor='isActive' className='text-sm cursor-pointer'>
                Theatre is Active (visible to users)
              </label>
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className='bg-primary/10 border border-primary/20 rounded-lg p-6 mb-6'>
          <h3 className='text-lg font-medium mb-4 flex items-center gap-2'>
            <MapPinIcon className='w-5 h-5' />
            Address
          </h3>
          
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='md:col-span-2'>
              <label className='block text-sm mb-2'>Street Address *</label>
              <input
                type='text'
                name='address.street'
                value={formData.address.street}
                onChange={handleChange}
                required
                className='w-full px-4 py-2 bg-zinc-900 border border-gray-700 
                  rounded-md focus:outline-none focus:border-primary'
              />
            </div>

            <div>
              <label className='block text-sm mb-2'>City *</label>
              <input
                type='text'
                name='address.city'
                value={formData.address.city}
                onChange={handleChange}
                required
                className='w-full px-4 py-2 bg-zinc-900 border border-gray-700 
                  rounded-md focus:outline-none focus:border-primary'
              />
            </div>

            <div>
              <label className='block text-sm mb-2'>State *</label>
              <input
                type='text'
                name='address.state'
                value={formData.address.state}
                onChange={handleChange}
                required
                className='w-full px-4 py-2 bg-zinc-900 border border-gray-700 
                  rounded-md focus:outline-none focus:border-primary'
              />
            </div>

            <div>
              <label className='block text-sm mb-2'>ZIP Code *</label>
              <input
                type='text'
                name='address.zipCode'
                value={formData.address.zipCode}
                onChange={handleChange}
                required
                className='w-full px-4 py-2 bg-zinc-900 border border-gray-700 
                  rounded-md focus:outline-none focus:border-primary'
              />
            </div>

            <div>
              <label className='block text-sm mb-2'>Country *</label>
              <input
                type='text'
                name='address.country'
                value={formData.address.country}
                onChange={handleChange}
                required
                className='w-full px-4 py-2 bg-zinc-900 border border-gray-700 
                  rounded-md focus:outline-none focus:border-primary'
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className='bg-primary/10 border border-primary/20 rounded-lg p-6 mb-6'>
          <h3 className='text-lg font-medium mb-4 flex items-center gap-2'>
            <PhoneIcon className='w-5 h-5' />
            Contact Information
          </h3>
          
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm mb-2'>Phone Number *</label>
              <input
                type='tel'
                name='contact.phone'
                value={formData.contact.phone}
                onChange={handleChange}
                required
                className='w-full px-4 py-2 bg-zinc-900 border border-gray-700 
                  rounded-md focus:outline-none focus:border-primary'
              />
            </div>

            <div>
              <label className='block text-sm mb-2'>Email Address *</label>
              <input
                type='email'
                name='contact.email'
                value={formData.contact.email}
                onChange={handleChange}
                required
                className='w-full px-4 py-2 bg-zinc-900 border border-gray-700 
                  rounded-md focus:outline-none focus:border-primary'
              />
            </div>
          </div>
        </div>

        {/* Policies */}
        <div className='bg-primary/10 border border-primary/20 rounded-lg p-6 mb-6'>
          <h3 className='text-lg font-medium mb-4 flex items-center gap-2'>
            <FileTextIcon className='w-5 h-5' />
            Theatre Policies
          </h3>
          
          <div className='space-y-4'>
            <div>
              <label className='block text-sm mb-2'>Cancellation Policy</label>
              <textarea
                name='policies.cancellationPolicy'
                value={formData.policies.cancellationPolicy}
                onChange={handleChange}
                rows='3'
                className='w-full px-4 py-2 bg-zinc-900 border border-gray-700 
                  rounded-md focus:outline-none focus:border-primary'
              />
            </div>

            <div>
              <label className='block text-sm mb-2'>Refund Policy</label>
              <textarea
                name='policies.refundPolicy'
                value={formData.policies.refundPolicy}
                onChange={handleChange}
                rows='3'
                className='w-full px-4 py-2 bg-zinc-900 border border-gray-700 
                  rounded-md focus:outline-none focus:border-primary'
              />
            </div>

            <div>
              <label className='block text-sm mb-2'>Other Policies</label>
              <textarea
                name='policies.otherPolicies'
                value={formData.policies.otherPolicies}
                onChange={handleChange}
                rows='3'
                className='w-full px-4 py-2 bg-zinc-900 border border-gray-700 
                  rounded-md focus:outline-none focus:border-primary'
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className='flex gap-4'>
          <button
            type='submit'
            disabled={loading}
            className='px-8 py-3 bg-primary hover:bg-primary/80 rounded-md 
              transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {loading ? 'Updating...' : 'Update Theatre'}
          </button>
          <button
            type='button'
            onClick={() => navigate('/theatre/my-theatres')}
            className='px-8 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors'
          >
            Cancel
          </button>
        </div>
      </form>
    </>
  );
};

export default EditTheatre;
