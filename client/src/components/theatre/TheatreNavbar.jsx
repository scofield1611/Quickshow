import React from 'react';
import { assets } from '../../assets/assets';
import { UserButton } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { TheaterIcon } from 'lucide-react';

const TheatreNavbar = () => {
  return (
    <div className='flex items-center justify-between px-4 md:px-8 py-3 
      border-b border-gray-300/20 backdrop-blur-sm bg-zinc-900/50'>
      <Link to='/theatre' className='flex items-center gap-2'>
        <TheaterIcon className='w-8 h-8 text-primary' />
        <span className='text-xl font-semibold hidden md:block'>Theatre Owner Portal</span>
      </Link>
      
      <div className='flex items-center gap-4'>
        <Link 
          to='/' 
          className='text-sm text-gray-400 hover:text-white transition-colors'
        >
          Back to Home
        </Link>
        <UserButton afterSignOutUrl='/' />
      </div>
    </div>
  );
};

export default TheatreNavbar;
