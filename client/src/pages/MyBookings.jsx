import React, { useEffect, useState } from 'react'
import Loading from '../components/Loading'
import BlurCircle from '../components/Blurcircle'
import timeformat from '../lib/timeformat'
import dateFormat from '../lib/dateFormat'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { CalendarIcon, ClockIcon, MapPinIcon, TicketIcon, XIcon } from 'lucide-react'


const MyBookings = () => {
    const currency = import.meta.env.VITE_CURRENCY;
    const { axios, getToken, user, image_base_url } = useAppContext();

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showTicket, setShowTicket] = useState(false);

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

    const formatShowDate = (val) => {
        if (val === null || val === undefined || val === "") return "N/A";
        try {
            const d = typeof val === "string" || typeof val === "number" ? new Date(val) : val;
            if (Number.isNaN(d?.getTime?.())) return "Invalid date";
            return dateFormat(d, "ddd, mmm dS, yyyy"); // e.g., "Sat, Oct 25th, 2025"
        } catch (err) {
            console.error("dateFormat error:", err, val);
            return "Invalid date";
        }
    };

    const formatShowTime = (val) => {
        if (val === null || val === undefined || val === "") return "N/A";
        try {
            const d = typeof val === "string" || typeof val === "number" ? new Date(val) : val;
            if (Number.isNaN(d?.getTime?.())) return "N/A";
            return d.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            });
        } catch (err) {
            console.error("timeFormat error:", err, val);
            return "N/A";
        }
    };

    // Seats could be an array or an object — handle both
    const safeSeats = (seats) => {
        if (!seats) return "N/A";
        if (Array.isArray(seats)) return seats.join(", ");
        if (typeof seats === "object") return Object.keys(seats).map((k) => seats[k]).join(", ");
        return String(seats);
    };

    const handleViewTicket = (booking) => {
        if (!booking.isPaid) {
            toast.error('Please complete payment to view ticket');
            return;
        }
        setSelectedBooking(booking);
        setShowTicket(true);
    };

    const handleCloseTicket = () => {
        setShowTicket(false);
        setSelectedBooking(null);
    };

    // Ticket Modal Component
    const TicketModal = ({ booking }) => {
        if (!booking) return null;

        const show = booking?.show ?? {};
        const movie = show?.movie ?? {};
        const theatre = booking?.theatre ?? {};
        
        const qrData = encodeURIComponent(JSON.stringify({
            bookingId: booking._id,
            movieTitle: movie?.title || 'Unknown Movie',
            theatre: theatre?.name || 'Theatre',
            hall: show?.hallName || '',
            showDate: formatShowDate(show?.showDateTime),
            showTime: formatShowTime(show?.showDateTime),
            seats: safeSeats(booking?.bookedSeats),
            amount: booking?.amount,
            isPaid: booking?.isPaid
        }));
        
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`;

        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl max-w-md w-full shadow-2xl border border-primary/30 relative overflow-hidden max-h-[90vh] overflow-y-auto">
                    {/* Close Button */}
                    <button
                        onClick={handleCloseTicket}
                        className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors z-10"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>

                    {/* Ticket Header */}
                    <div className="bg-primary/10 border-b border-primary/30 p-6 pb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <TicketIcon className="w-6 h-6 text-primary" />
                            <h2 className="text-2xl font-bold">Your Ticket</h2>
                        </div>
                        <p className="text-sm text-gray-400">Booking ID: #{booking._id?.slice(-8)}</p>
                    </div>

                    {/* Ticket Body */}
                    <div className="p-6 space-y-6">
                        {/* Movie Info */}
                        <div className="text-center border-b border-gray-700 pb-6">
                            <h3 className="text-2xl font-bold mb-2">{movie?.title || 'Unknown Movie'}</h3>
                            {movie?.runtime && (
                                <p className="text-gray-400 text-sm">{timeformat(movie.runtime)}</p>
                            )}
                        </div>

                        {/* Show Details */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-400 mb-1">Date</p>
                                <p className="font-medium">{formatShowDate(show?.showDateTime)}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 mb-1">Time</p>
                                <p className="font-medium text-primary">{formatShowTime(show?.showDateTime)}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 mb-1">Theatre</p>
                                <p className="font-medium">{theatre?.name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 mb-1">Screen</p>
                                <p className="font-medium">{show?.hallName || 'N/A'}</p>
                            </div>
                        </div>

                        {/* Seats */}
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                            <p className="text-gray-400 text-sm mb-2">Seat Numbers</p>
                            <p className="text-xl font-bold text-primary">{safeSeats(booking?.bookedSeats)}</p>
                            <p className="text-gray-400 text-xs mt-2">
                                {Array.isArray(booking?.bookedSeats) ? booking.bookedSeats.length : 1} Ticket(s)
                            </p>
                        </div>

                        {/* QR Code */}
                        <div className="flex flex-col items-center bg-white rounded-lg p-6">
                            <img 
                                src={qrCodeUrl}
                                alt="Ticket QR Code"
                                className="w-48 h-48"
                            />
                            <p className="text-gray-600 text-xs mt-3 text-center">
                                Show this QR code at the theatre entrance
                            </p>
                        </div>

                        {/* Amount */}
                        <div className="text-center border-t border-gray-700 pt-4">
                            <p className="text-gray-400 text-sm mb-1">Total Amount Paid</p>
                            <p className="text-3xl font-bold text-primary">{currency}{booking?.amount}</p>
                        </div>
                    </div>

                    {/* Ticket Footer */}
                    <div className="bg-primary/5 border-t border-primary/30 p-4 text-center">
                        <p className="text-xs text-gray-500">
                            Please arrive 15 minutes before showtime
                        </p>
                    </div>

                    {/* Decorative Notches */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-black rounded-full"></div>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-black rounded-full"></div>
                </div>
            </div>
        );
    };

    return !loading ? (
        <div className="relative px-6 md:px-16 lg:px-40 pt-30 min-h-[80vh] md:pt-40">
            <div>
                <h1 className="text-2xl font-bold mb-6">My Bookings</h1>
                {bookings.length === 0 && (
                    <div className="text-center py-12 bg-primary/10 border border-primary/20 rounded-lg">
                        <TicketIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                        <p className="text-gray-400">You have no bookings yet.</p>
                        <p className="text-sm text-gray-500 mt-2">Book your first show to see it here!</p>
                    </div>
                )}
                {bookings.map((item, index) => {
                    // safe reads
                    const show = item?.show ?? null;
                    const movie = show?.movie ?? (item?.show?.movie ?? null);
                    const theatre = item?.theatre ?? null;
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
                            className={`flex flex-col md:flex-row justify-between bg-primary/20 border border-primary/30 rounded-lg mt-4 p-4 max-w-4xl hover:bg-primary/25 transition-colors ${item?.isPaid ? 'cursor-pointer' : ''}`}
                            onClick={() => {
                                if (item?.isPaid) {
                                    handleViewTicket(item);
                                }
                            }}
                        >
                            <div className="flex flex-col md:flex-row gap-4">
                                {poster ? (
                                    <img
                                        src={(image_base_url ?? "") + poster}
                                        alt={title}
                                        className="w-full md:w-32 h-48 object-cover rounded"
                                        onError={(e) => {
                                            e.currentTarget.onerror = null;
                                            e.currentTarget.style.display = "none";
                                        }}
                                    />
                                ) : (
                                    <div className="w-full md:w-32 h-48 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded flex items-center justify-center">
                                        <div className="text-center p-4">
                                            <div className="text-4xl mb-2">🎬</div>
                                            <p className="text-sm text-gray-400">{title}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col justify-between py-1">
                                    <div>
                                        <p className="text-xl font-bold mb-2">{title}</p>
                                        {runtime && (
                                            <p className="text-gray-400 text-sm mb-3">
                                                {timeformat(runtime)}
                                            </p>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-2 text-sm">
                                        {/* Date */}
                                        <div className="flex items-center gap-2 text-gray-300">
                                            <CalendarIcon className="w-4 h-4 text-primary" />
                                            <span>{formatShowDate(showDateTime)}</span>
                                        </div>
                                        
                                        {/* Time */}
                                        <div className="flex items-center gap-2 text-gray-300">
                                            <ClockIcon className="w-4 h-4 text-primary" />
                                            <span className="font-medium">{formatShowTime(showDateTime)}</span>
                                        </div>
                                        
                                        {/* Theatre & Hall */}
                                        {theatre && (
                                            <div className="flex items-center gap-2 text-gray-300">
                                                <MapPinIcon className="w-4 h-4 text-primary" />
                                                <span>
                                                    {theatre.name}
                                                    {show?.hallName && ` - ${show.hallName}`}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col justify-between md:items-end md:text-right mt-4 md:mt-0 py-1">
                                <div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div>
                                            <p className="text-sm text-gray-400">Total Amount</p>
                                            <p className="text-2xl font-bold text-primary">
                                                {currency}{amount}
                                            </p>
                                        </div>
                                        {!item?.isPaid && item?.paymentLink && (
                                            <Link
                                                to={item.paymentLink}
                                                onClick={(e) => e.stopPropagation()}
                                                className="bg-primary hover:bg-primary/80 px-5 py-2 rounded font-medium text-sm cursor-pointer transition-colors"
                                            >
                                                Pay Now
                                            </Link>
                                        )}
                                        {item?.isPaid && (
                                            <div className="flex flex-col items-end gap-2">
                                                <div className="px-4 py-1.5 bg-green-500/20 border border-green-500/50 rounded text-green-400 text-xs font-medium">
                                                    ✓ Paid
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewTicket(item);
                                                    }}
                                                    className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
                                                >
                                                    <TicketIcon className="w-3 h-3" />
                                                    View Ticket
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1 text-sm">
                                    <div className="flex items-center justify-between md:justify-end gap-8">
                                        <span className="text-gray-400">Tickets:</span>
                                        <span className="font-medium">{totalTickets}</span>
                                    </div>
                                    <div className="flex items-center justify-between md:justify-end gap-8">
                                        <span className="text-gray-400">Seats:</span>
                                        <span className="font-medium">{seatsDisplay}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Ticket Modal */}
            {showTicket && selectedBooking && (
                <TicketModal booking={selectedBooking} />
            )}
        </div>
    ) : (
        <Loading />
    );
};

export default MyBookings;
