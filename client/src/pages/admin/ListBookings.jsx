import React, { useEffect, useState } from 'react'
import Loading from '../../components/Loading'
import Title from '../../components/admin/title'
import dateFormat from '../../lib/dateFormat'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'



const ListBookings = () => {
    const currency = import.meta.env.VITE_CURRENCY;
    const { axios, getToken, user } = useAppContext();

    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const getAllBookings = async () => {
        try {
            const { data } = await axios.get("/api/admin/all-bookings", {
                headers: { Authorization: `Bearer ${await getToken()}` }
            });

            if (data.success) {
                setBookings(Array.isArray(data.bookings) ? data.bookings : []);
            } else {
                toast.error(data.message || "Failed to fetch bookings.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch bookings.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) getAllBookings();
    }, [user]);

    // Safe wrapper for date formatting
    const safeDateFormat = (val) => {
        if (!val && val !== 0) return "N/A";
        try {
            return dateFormat(val); // keep your existing usage — adjust if it needs a format string
        } catch (err) {
            console.error("dateFormat error:", err, val);
            return "Invalid date";
        }
    };

    return !isLoading ? (
        <>
            <Title text1={"List"} text2={"Bookings"} />
            <table className="w-full border-collapse rounded-md overflow-hidden whitespace-nowrap">
                <thead>
                <tr className="bg-primary/20 text-left text-white">
                    <th className="p-2 font-medium pl-5">User Name</th>
                    <th className="p-2 font-medium">Movie Name</th>
                    <th className="p-2 font-medium">Show Time</th>
                    <th className="p-2 font-medium">Seats</th>
                    <th className="p-2 font-medium">Amount</th>
                </tr>
                </thead>

                <tbody className="text-sm font-light">
                {bookings.map((item, index) => {
                    const userName = item?.user?.name ?? "Unknown User";
                    const movieTitle =
                        item?.show?.movie?.title ?? item?.show?.movie ?? "Unknown Movie";
                    const showDateTime = item?.show?.showDateTime ?? item?.showDateTime;
                    const seats = item?.bookedSeats
                        ? Object.keys(item.bookedSeats).map((s) => item.bookedSeats[s]).join(" ,")
                        : "N/A";
                    const amount = item?.amount ?? "N/A";

                    return (
                        <tr
                            key={item?._id ?? index}
                            className="border-b border-primary/10 bg-primary/5 even:bg-primary/10"
                        >
                            <td className="p-2 min-w-45 pl-5">{userName}</td>
                            <td className="p-2">{movieTitle}</td>
                            <td className="p-2">{safeDateFormat(showDateTime)}</td>
                            <td className="p-2">{seats}</td>
                            <td className="p-2">
                                {currency} {amount}
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </>
    ) : (
        <Loading />
    );
};

export default ListBookings;

