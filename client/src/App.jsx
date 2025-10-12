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
import { useAppContext } from './context/AppContext'
import { SignIn } from '@clerk/clerk-react'
import Loading from './components/Loading'

const App = () => {
  const isAdminRoute = useLocation().pathname.startsWith('/admin');// Check if the current route is an admin route
  const {user} = useAppContext()
  return (
    <>
      <Toaster /> {/* Toast notification container */}
      {!isAdminRoute && <Navbar/>}
      <Routes> {/* Define application routes */}
        <Route path='/' element = {<Home/>} />
        <Route path='/movies' element = {<Movies/>} />
        <Route path='/movies/:id' element = {<MovieDetails/>} />
        <Route path='/movies/:id/:date' element = {<SeatLayout/>} />
        <Route path='/my-bookings' element = {<MyBookings/>} />
        <Route path='/loading/:nextUrl' element = {<Loading/>} />
        <Route path='/favorite' element = {<Favorite/>} /> 
        <Route path='/admin/*' element = {user ?<Layout/> : (
          <div className='flex justify-center items-center h-screen'>
            <SignIn fallbackRedirectUrl={'/admin'} />
          </div>
        )}>
          <Route index element = {<Dashboard/>} />
          <Route path='add-shows' element = {<AddShows/>} />
          <Route path='list-shows' element = {<ListShows/>} />
          <Route path='list-bookings' element = {<ListBookings/>} />   
        </Route>
      </Routes>
      {!isAdminRoute && <Footer/>}
    </>
  )
}

export default App
