import React, { useState } from 'react'
import BlurCircle from './Blurcircle'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';


const DateSelect = ({dateTime,id}) => {
    const[selectedDate,setSelectedDate] = useState(null);

    const navigate = useNavigate();
    const onBookHandler = () => {
        if(!selectedDate) {
            return toast('Please select a date first')
        }
        navigate(`/movies/${id}/${selectedDate}`); scrollTo(0,0)
    }
  return (
    <div id='dateSelect' className=' pt-30'>
        <div className='flex flex-col items-center justify-between gap-10 realtive p-8 bg-primary/10
        border border-primary/20 rounded-lg '>
            <BlurCircle top='100px' right='0px'/>
            <BlurCircle top='-100px' left='-100px'/>
            <div>
                <p className='text-lg font-semibold'>Choose Date</p>
                <div className='flex items-center gap-6 mt-5 text-sm'>
                    <ChevronLeftIcon width={28} />
                    <span className='grid grid-cols-3 md:f;ex flex wrap md:max-w-lg
                    gap-4'>
                        {Object.keys(dateTime).map((date) => (
                            <button onClick={() =>setSelectedDate(date) } key={date} className={`flex flex-col items-center
                            justify-center h-14 w-14 aspect-square rounded cursor-pointer
                            ${selectedDate === date ? 'bg-primary text-white' : 'border border-primary/70'}`}>
                                <span>{ new Date(date).getDate()}</span>
                                <span>{ new Date(date).toLocaleDateString("en-US",{month:"short"})}</span>
                            </button>
                        ))}
                    </span>
                    <ChevronRightIcon width={28} />
                </div>
            </div>
            <button onClick={onBookHandler} className='bg-primary text-white px-8 py-2 mt-6 rounded 
            hover:bg-primary/90 transition-all cursor-pointer'>Book Now</button>

        </div>
      
    </div>
  )
}

export default DateSelect
