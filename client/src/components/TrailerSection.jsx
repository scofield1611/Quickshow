import React, { useState } from 'react';
import { dummyTrailers } from '../assets/assets';
import BlurCircle from './Blurcircle';
import ReactPlayer from 'react-player';
console.log(dummyTrailers); // <-- ADD THIS LINE


const TrailerSection = () => {
    // Fixed: Renamed state for clarity
    const [currentTrailer, setCurrentTrailer] = useState(dummyTrailers[2]);

    return (
        <div className='px-6 md:px-16 lg:px-24 xl:px-44 py-20 overflow-hidden'>
            <p className='text-gray-300 font-medium text-lg max-w-[960px] mx-auto'>
                Trailers
            </p>
            
            <div className='relative mt-6'>
                <BlurCircle top='-100px' right='-100px' /> 
                <ReactPlayer 
                    url={currentTrailer.videoUrl} // Fixed: Using the renamed state
                    controls={false}
                    className='mx-auto max-w-full' 
                    width="960px" 
                    height="540px" 
                />
            </div>
        </div>
    );
}

export default TrailerSection;