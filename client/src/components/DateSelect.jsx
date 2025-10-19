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
    
      
    </div>
  )
}

export default DateSelect
