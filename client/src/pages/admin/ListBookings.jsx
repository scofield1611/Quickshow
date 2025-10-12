import React, { useEffect, useState } from 'react'
import Loading from '../../components/Loading'
import Title from '../../components/admin/title'
import dateFormat from '../../lib/dateFormat'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'

const ListBookings = () => {
    const currency = import.meta.env.VITE_CURRENCY
      const { axios, getToken, user} = useAppContext();
    

    const [bookings,setBookings] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    const getAllBookings = async () => {
  try {
    const { data } = await axios.get("/api/admin/all-bookings", {
      headers: { Authorization: `Bearer ${await getToken()}` }
    });

    // Add a check for the success flag
    if (data.success) {
      setBookings(data.bookings);
    } else {
      // Show an error toast if the API returns a failure message
      toast.error(data.message);
    }

  } catch (error) {
    console.error(error);
    toast.error("Failed to fetch bookings."); // Inform the user
  } finally {
    // This block will always run, whether the try or catch block executes
    setIsLoading(false);
  }
};
    useEffect(() =>{
        if(user){
      getAllBookings()
        }
    },[user])
  return !isLoading ? (
    <>
      <Title text1={"List"} text2={"Bookings"}/>
      <table className='w-full border-collapse rounded-md overflow-hidden whitespace-nowrap'>
            <thead>
                <tr className='bg-primary/20 text-left text-white'>
                    <th className='p-2 font-medium pl-5'>User Name</th>
                    <th className='p-2 font-medium'>Movie Name</th>
                    <th className='p-2 font-medium'>Show Time </th>
                    <th className='p-2 font-medium'>Seats</th>
                    <th className='p-2 font-medium'>Amount</th>
                </tr>
            </thead>
            <tbody className='text-sm font-light'>
              {bookings.map((item,index) => (
                  <tr key={index} className='border-b border-primary/10 bg-primary/5 even:bg-primary/10'>
                      <td className='p-2 min-w-45 pl-5'>{item.user.name} </td>
                      <td className='p-2'>{item.show.movie.title} </td>
                      <td className='p-2'>{dateFormat(item.show.showDateTime)} </td>
                      <td className='p-2'>{Object.keys(item.bookedSeats).map(seat =>
                        item.bookedSeats[seat]).join(" ,") }</td>
                      <td>{currency} {item.amount}</td>
                  </tr>
                ))}
            </tbody>
        </table>
    </>
  ) : <Loading/>
}

export default ListBookings
