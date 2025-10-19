import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import { MenuIcon, SearchIcon, TicketPlus, XIcon } from 'lucide-react'
import { useClerk, UserButton, useUser} from '@clerk/clerk-react'
import { useAppContext } from '../context/AppContext'

const Navbar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false); {/* State to manage mobile menu visibility */}
  const{user} = useUser(); {/* Clerk hook to get current user */}
  const{openSignIn} = useClerk(); {/* Clerk hooks for user authentication */}
  const {favoriteMovies} = useAppContext();
  
    return (
    <div className='fixed top-0 left-0 z-50 w-full flex items-center justify-between px-6 md:px-16 lg:px-36 py-5'>
      <Link to='/' className='max-md:flex-1'>
        <img src={assets.logo} alt='logo' className='w-36 h-auto'/>   {/* Logo */}
      </Link>

      <div className={`max-md:absolute max-md:top-0 max-md:left-0
        max-md:font-medium max-md:text-lg z-50 flex flex-col md:flex-row items-center
        max-md:justify-center gap-8 md:gap-8 py-3 px-6 max-md:h-screen
        md:rounded-full backdrop-blur bg-black/70 md:bg-white/10 md:border
        border-gray-300/20 overflow-hidden transition-[width] duration-300
        ${isOpen ? 'max-md:w-full' : 'max-md:w-0 max-md:opacity-0'}`}> {/* Navigation links */}  
 
        <XIcon className='md:hidden absolute top-6 right-6 w-6 h-6 cursor-pointer'
        onClick={() => setIsOpen(!isOpen)}/>
        <Link onClick={() => {scrollTo(0,0), setIsOpen(false)}} to='/'>Home</Link>
        <Link onClick={() => {scrollTo(0,0), setIsOpen(false)}} to='/movies'>Movies</Link>
        <Link onClick={() => {scrollTo(0,0), setIsOpen(false)}} to='/theatres'>Theatres</Link>
        <Link onClick={() => {scrollTo(0,0), setIsOpen(false)}} to='/'>Release</Link>
        {favoriteMovies.length > 0 && (
          <Link onClick={() => {scrollTo(0,0), setIsOpen(false)}} to='/favorite'>Favorite</Link>
        )}
      </div>

      <div className='flex items-center gap-8'>
        <SearchIcon className='max-md:hidden w-6 h-6 cursor-pointer'/>
        {
          !user ? (<button onClick={openSignIn} className='px-4 py-1 sm:px-7 sm:py-2 bg-primary
          hover:bg-primary-dull transition rounded-full font-medium
          cursor-pointer'> {/* Sign In button if user is not logged in */}
          Login
        </button>) : (
          <UserButton>
            <UserButton.MenuItems>
              <UserButton.Action label='My-Bookings' 
              labelIcon={ <TicketPlus width={15} />}
              onClick={() => navigate('/My-Bookings')} />  {/* User menu with My-Bookings option */}
            </UserButton.MenuItems>
          </UserButton> 
        )
        }
      </div>

      <MenuIcon className='max-md:ml-4 w-8 h-8 cursor-pointer md:hidden'
      onClick={() => setIsOpen(!isOpen)}/> {/* Hamburger menu icon for mobile */}
    </div>
  )
}

export default Navbar
