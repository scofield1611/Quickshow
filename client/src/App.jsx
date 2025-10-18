import React from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Movies from './pages/Movies'
import MovieDetails from './pages/MovieDetails'
import SeatLayout from './pages/SeatLayout'
import MyBookings from './pages/MyBookings'
import Favorite from './pages/Favorite'
import Navbar from './components/Navbar'
import { Toaster } from 'react-hot-toast'
import Footer from './components/Footer'
import Layout from './pages/admin/Layout'
import AddShows from './pages/admin/AddShows'
import Dashboard from './pages/admin/Dashboard'
import ListShows from './pages/admin/ListShows'
import ListBookings from './pages/admin/ListBookings'
import TheatreManagement from './pages/admin/TheatreManagement'
import TheatreLayout from './pages/theatre/TheatreLayout'
import TheatreDashboard from './pages/theatre/TheatreDashboard'
import AddTheatre from './pages/theatre/AddTheatre'
import MyTheatres from './pages/theatre/MyTheatres'
import ManageShows from './pages/theatre/ManageShows'
import AddShow from './pages/theatre/AddShow'
import { useAppContext } from './context/AppContext'
import { SignIn } from '@clerk/clerk-react'
import Loading from './components/Loading'

const App = () => {
  const isAdminRoute = useLocation().pathname.startsWith('/admin');
  const isTheatreRoute = useLocation().pathname.startsWith('/theatre');
  const {user} = useAppContext()
  
  return (
    <>
      <Toaster />
      {!isAdminRoute && !isTheatreRoute && <Navbar/>}
      <Routes>
        <Route path='/' element = {<Home/>} />
        <Route path='/movies' element = {<Movies/>} />
        <Route path='/movies/:id' element = {<MovieDetails/>} />
        <Route path='/movies/:id/:date' element = {<SeatLayout/>} />
        <Route path='/my-bookings' element = {<MyBookings/>} />
        <Route path='/loading/:nextUrl' element = {<Loading/>} />
        <Route path='/favorite' element = {<Favorite/>} /> 
        
        {/* Admin Routes */}
        <Route path='/admin/*' element = {user ?<Layout/> : (
          <div className='flex justify-center items-center h-screen'>
            <SignIn fallbackRedirectUrl={'/admin'} />
          </div>
        )}>
          <Route index element = {<Dashboard/>} />
          <Route path='add-shows' element = {<AddShows/>} />
          <Route path='list-shows' element = {<ListShows/>} />
          <Route path='list-bookings' element = {<ListBookings/>} />   
          <Route path='theatres' element = {<TheatreManagement/>} />   
        </Route>

        {/* Theatre Owner Routes */}
        <Route path='/theatre/*' element = {user ? <TheatreLayout/> : (
          <div className='flex justify-center items-center h-screen'>
            <SignIn fallbackRedirectUrl={'/theatre'} />
          </div>
        )}>
          <Route index element = {<TheatreDashboard/>} />
          <Route path='my-theatres' element = {<MyTheatres/>} />
          <Route path='add-theatre' element = {<AddTheatre/>} />
          <Route path='add-show' element = {<AddShow/>} />
          <Route path='add-show/:theatreId' element = {<AddShow/>} />
          <Route path='manage-shows/:theatreId' element = {<ManageShows/>} />
        </Route>
      </Routes>
      {!isAdminRoute && !isTheatreRoute && <Footer/>}
    </>
  )
}

export default App
