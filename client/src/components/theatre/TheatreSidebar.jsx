import React from 'react';
import { assets } from '../../assets/assets';
import { 
  LayoutDashboardIcon, 
  TheaterIcon, 
  PlusSquareIcon, 
  ListIcon,
  SettingsIcon 
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';

const TheatreSidebar = () => {
  const { user } = useUser();

  const theatreLinks = [
    { name: 'Dashboard', path: '/theatre', icon: LayoutDashboardIcon },
    { name: 'My Theatres', path: '/theatre/my-theatres', icon: TheaterIcon },
    { name: 'Add Theatre', path: '/theatre/add-theatre', icon: PlusSquareIcon },
    { name: 'Manage Shows', path: '/theatre/manage-shows', icon: ListIcon },
    { name: 'Settings', path: '/theatre/settings', icon: SettingsIcon },
  ];

  return (
    <div className='h-[calc(100vh-64px)] md:flex flex-col items-center pt-8 
    max-w-13 md:max-w-60 border-r border-gray-300/20 text-sm'>
      <img 
        className='h-9 md:h-14 w-9 md:w-14 rounded-full mx-auto'
        src={user?.imageUrl || assets.profile} 
        alt="profile" 
      />
      <p className='mt-2 text-base max-md:hidden'>
        {user?.firstName} {user?.lastName}
      </p>
      <p className='text-xs text-gray-400 max-md:hidden'>Theatre Owner</p>
      
      <div className='w-full'>
        {theatreLinks.map((link, index) => (
          <NavLink 
            key={index} 
            to={link.path} 
            end
            className={({isActive}) => `relative flex items-center gap-2 max-md:justify-center
              py-2.5 md:pl-10 first:mt-6 text-gray-400 hover:text-white transition-colors
              ${isActive && 'bg-primary/15 text-primary'}`}
          >
            {({isActive}) => (
              <>
                <link.icon className='w-5 h-5'/>
                <p className='max-md:hidden'>{link.name}</p>
                <span className={`w-1.5 h-10 rounded-l right-0 absolute
                  ${isActive && 'bg-primary'}`} />
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default TheatreSidebar;
