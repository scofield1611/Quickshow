import React, { useEffect, useState } from 'react'
import Loading from '../components/Loading'
import BlurCircle from '../components/Blurcircle'
import timeformat from '../lib/timeformat'
import dateFormat from '../lib/dateFormat'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'


const MyBookings = () => {
    const currency = import.meta.env.VITE_CURRENCY;
    const { axios, getToken, user, image_base_url } = useAppContext();

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const getMyBookings = async () => {
        try {
            const { data } = await axios.get("/api/user/bookings", {
                headers: { Authorization: `Bearer ${await getToken()}` },
            });

            if (data?.success) {
                setBookings(Array.isArray(data.bookings) ? data.bookings : []);
            } else {
                toast.error(data?.message || "Failed to fetch your bookings.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch your bookings.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) getMyBookings();
    }, [user]);

    const safeDateFormat = (val) => {
        if (val === null || val === undefined || val === "") return "N/A";
        try {
            // If it's an ISO string, convert to Date first (dateFormat expects Date or parsable string)
            const d = typeof val === "string" || typeof val === "number" ? new Date(val) : val;
            if (Number.isNaN(d?.getTime?.())) return "Invalid date";
            return dateFormat(d, "mmmm dS, yyyy, h:MM TT"); // change format as you like
        } catch (err) {
            console.error("dateFormat error:", err, val);
            return "Invalid date";
        }
    };

    // Seats could be an array or an object — handle both
    const safeSeats = (seats) => {
        if (!seats) return "N/A";
        if (Array.isArray(seats)) return seats.join(", ");
        if (typeof seats === "object") return Object.keys(seats).map((k) => seats[k]).join(", ");
        return String(seats);
    };

    return !loading ? (
        <div className="relative px-6 md:px-16 lg:px-40 pt-30 min-h-[80vh] md:pt-40">
            <div>
                <h1 className="text-lg font-semibold mb-4">My Bookings</h1>
                {bookings.length === 0 && <p className="text-gray-500">You have no bookings.</p>}
                {bookings.map((item, index) => {
                    // safe reads
                    const show = item?.show ?? null;
                    const movie = show?.movie ?? (item?.show?.movie ?? null);
                    const poster = movie?.poster_path ?? null;
                    const title = movie?.title ?? (typeof movie === "string" ? movie : "Unknown Movie");
                    const runtime = movie?.runtime ?? null;
                    const showDateTime = show?.showDateTime ?? item?.showDateTime ?? null;
                    const amount = item?.amount ?? "N/A";
                    const seatsDisplay = safeSeats(item?.bookedSeats);
                    const totalTickets = Array.isArray(item?.bookedSeats)
                        ? item.bookedSeats.length
                        : typeof item?.bookedSeats === "object"
                            ? Object.keys(item.bookedSeats).length
                            : "N/A";

                    return (
                        <div
                            key={item?._id ?? index}
                            className="flex flex-col md:flex-row justify-between bg-primary/20 rounded-lg mt-4 p-2 max-w-3xl"
                        >
                            <div className="flex flex-col md:flex-row">
                                {poster ? (
                                    <img
                                        src={(image_base_url ?? "") + poster}
                                        alt={title}
                                        className="md:max-w-45 aspect-video h-auto object-cover object-bottom rounded"
                                        onError={(e) => {
                                            e.currentTarget.onerror = null;
                                            e.currentTarget.style.display = "none";
                                        }}
                                    />
                                ) : (
                                    <div className="md:max-w-45 aspect-video bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded flex items-center justify-center">
                                        <div className="text-center p-4">
                                            <div className="text-4xl mb-2">🎬</div>
                                            <p className="text-sm text-gray-400">{title}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col p-4">
                                    <p className="text-lg font-semibold">{title}</p>
                                    <p className="text-gray-400 text-sm">
                                        {runtime ? timeformat(runtime) : ""}
                                    </p>
                                    <p className="text-gray-400 text-sm mt-auto">{safeDateFormat(showDateTime)}</p>
                                </div>
                            </div>

                            <div className="flex flex-col md:items-end md:text-right p-4">
                                <div className="flex items-center gap-4">
                                    <p className="text-2xl font-semibold mb-3">
                                        {currency}
                                        {amount}
                                    </p>
                                    {!item?.isPaid && item?.paymentLink && (
                                        <Link
                                            to={item.paymentLink}
                                            className="bg-primary px-4 py-1.5 rounded font-medium text-sm cursor-pointer"
                                        >
                                            Pay Now
                                        </Link>
                                    )}
                                </div>

                                <div className="text-sm">
                                    <p>
                                        <span className="text-gray-400">Total Tickets: </span>
                                        {totalTickets}
                                    </p>
                                    <p>
                                        <span className="text-gray-400">Seats Number: </span>
                                        {seatsDisplay}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    ) : (
        <Loading />
    );
};

export default MyBookings;
