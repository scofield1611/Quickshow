import React from 'react';
import { Outlet } from 'react-router-dom';
import TheatreNavbar from '../../components/theatre/TheatreNavbar';
import TheatreSidebar from '../../components/theatre/TheatreSidebar';

const TheatreLayout = () => {
  return (
    <div className='bg-zinc-950 min-h-screen text-white'>
      <TheatreNavbar />
      <div className='flex'>
        <TheatreSidebar />
        <div className='flex-1 p-4 md:p-8 overflow-y-auto'>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default TheatreLayout;
