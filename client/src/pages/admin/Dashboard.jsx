import { ChartLineIcon, CircleDollarSignIcon, PlayCircleIcon, StarIcon, UsersIcon } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { dummyDashboardData } from '../../assets/assets'
import Loading from '../../components/Loading'
import Title from '../../components/admin/title'
import BlurCircle from '../../components/Blurcircle'
import dateFormat from '../../lib/dateFormat'

const Dashboard = () => {

    const currency = import.meta.env.VITE_CURRENCY
    const [DashboardData , setDashboardData] = useState({
        totalBookings : 0,
        totalRevenue : 0,
        activeShows: [],
        totalUser: 0
    })
    const [loading, setLoading] = useState(true)

    const DashboardCards =[
        {title : "Total Bookings", value : DashboardData.totalBookings
            || "0" , icon : ChartLineIcon},
        {title : "Total Revenue", value : currency + DashboardData.totalRevenue
            || "0" , icon : CircleDollarSignIcon},
        {title : "Active Shows", value : DashboardData.activeShows.length
            || "0" , icon : PlayCircleIcon},
        {title : "Total Users", value : DashboardData.totalUser
            || "0" , icon : UsersIcon}
    ]

    const fetchDashBoardData = async () =>{
        setDashboardData(dummyDashboardData)
        setLoading(false)
    }
    useEffect(() =>{
        fetchDashBoardData()
    },[])
  return !loading ? (
    <>
      <Title text1={"Admin"} text2={"DashBoard"} />

      <div className='relative flex flex-wrap gap-4 mt-6'>
        <BlurCircle top='-100px' left='0'/>
        <div className='flex flex-wrap gap-4 w-full'>
            {DashboardCards.map((Card,index) =>(
                <div key={index} className='flex items-center justify-between px-4
                py-3 bg-primary/10 border border-priary/20 rounded-md max-w-50 w-full'>
                    <div>
                        <h1 className='text-sm'>{Card.title}</h1>
                        <p className='text-xl font-medium mt-1'>{Card.value}</p>
                    </div>
                    <Card.icon className='w-6 h-6' />
                </div>
            ))}
        </div>
      </div>
      <p className='mt-10 text-lg font-medium'>Active Shows</p>
      <div className='relative flex flex-wrap gap-6 mt-4 max-w-5xl'>
        <BlurCircle top='100px' left='-10%' />
        {dummyDashboardData.activeShows.map((show) => (
        <div key={show._id} className='w-55 rounded-lg overflow-hidden  h-full
        pb-3 bg-primary/10 border border-primary/20 
        hover:-translate-y-1 transition duration-300'>
            <img src={show.movie.poster_path} alt=""
            className='h-60 w-full object-cover'/>
            <p className='font-medium p-2 truncate'>{show.movie.title} </p>
            <div className='flex items-center justify-between px-2'>
                <p className='text-lg font-medium'>{currency}{show.showPrice} </p>
                <p className='flex items-center gap-1 text-sm text-gray-400 mt-1 pr-1'>
                    <StarIcon className='w-4 h-4 text-primary fill-primary'/>
                    {show.movie.vote_average.toFixed(1)}
                </p>
            </div>
            <p className='px-2 pt-2 text-sm text-gray-500'>{dateFormat(show.showDateTime)}</p>
        </div>
        ))}

      </div>
    </>
  ) : <Loading />
}

export default Dashboard
