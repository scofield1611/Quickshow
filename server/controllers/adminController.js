import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import User from "../models/User.js";
import Theatre from "../models/Theatre.js";
import { clerkClient } from "@clerk/express";

// API to check if user is admin
export const isAdmin = async (req, res) => {
  res.json({success: true, isAdmin: true})
}

// API to get dashboard data
export const getDashboardData = async (req, res) => {
  try {
    const bookings = await Booking.find({isPaid: true});
    const activeShows = await Show.find({showDateTime: {$gte: new Date()}}).populate('movie');

    const totalUser = await User.countDocuments()
    const dashboardData = {
      totalBookings: bookings.length,
      totalRevenue: bookings.reduce((acc, booking) => acc + booking.amount, 0),
      activeShows,
      totalUser
    }

    res.json({ success: true, dashboardData });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
}

// API to get all shows
export const getAllShows = async (req, res) => {
  try {
    const shows = await Show.find({ showDateTime: { $gte: new Date() } }).populate('movie').sort({ showDateTime: 1 });
    res.json({ success: true, shows });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get all bookings
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({}).populate('user').populate({
      path: "show",
      populate: { path: "movie" }
    }).sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// ==================== THEATRE MANAGEMENT ====================

// @desc    Get all pending theatres
// @route   GET /api/admin/theatres/pending
// @access  Admin
export const getPendingTheatres = async (req, res) => {
  try {
    const theatres = await Theatre.find({ approvalStatus: 'PENDING_APPROVAL' })
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: theatres.length,
      theatres
    });
  } catch (error) {
    console.error("Error fetching pending theatres:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching pending theatres", 
      error: error.message 
    });
  }
};

// @desc    Get all theatres (with filters)
// @route   GET /api/admin/theatres
// @access  Admin
export const getAllTheatres = async (req, res) => {
  try {
    const { status, city, owner } = req.query;
    
    const filter = {};
    if (status) filter.approvalStatus = status;
    if (city) filter['address.city'] = new RegExp(city, 'i');
    if (owner) filter.owner = owner;

    const theatres = await Theatre.find(filter)
      .populate('owner', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: theatres.length,
      theatres
    });
  } catch (error) {
    console.error("Error fetching theatres:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching theatres", 
      error: error.message 
    });
  }
};

// @desc    Approve theatre
// @route   PUT /api/admin/theatres/:id/approve
// @access  Admin
export const approveTheatre = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.auth();
    const { notes } = req.body;

    const theatre = await Theatre.findById(id);

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: "Theatre not found"
      });
    }

    if (theatre.approvalStatus === 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: "Theatre is already approved"
      });
    }

    theatre.approvalStatus = 'APPROVED';
    theatre.approvedAt = new Date();
    theatre.approvedBy = userId;
    theatre.rejectionReason = null;

    await theatre.save();

    res.json({
      success: true,
      message: "Theatre approved successfully",
      theatre
    });
  } catch (error) {
    console.error("Error approving theatre:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error approving theatre", 
      error: error.message 
    });
  }
};

// @desc    Reject theatre
// @route   PUT /api/admin/theatres/:id/reject
// @access  Admin
export const rejectTheatre = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.auth();
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Please provide a rejection reason"
      });
    }

    const theatre = await Theatre.findById(id);

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: "Theatre not found"
      });
    }

    theatre.approvalStatus = 'REJECTED';
    theatre.rejectionReason = reason;
    theatre.approvedBy = userId;
    theatre.approvedAt = null;

    await theatre.save();

    res.json({
      success: true,
      message: "Theatre rejected",
      theatre
    });
  } catch (error) {
    console.error("Error rejecting theatre:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error rejecting theatre", 
      error: error.message 
    });
  }
};

// @desc    Get theatre statistics
// @route   GET /api/admin/theatres/stats
// @access  Admin
export const getTheatreStats = async (req, res) => {
  try {
    const totalTheatres = await Theatre.countDocuments();
    const pendingTheatres = await Theatre.countDocuments({ approvalStatus: 'PENDING_APPROVAL' });
    const approvedTheatres = await Theatre.countDocuments({ approvalStatus: 'APPROVED' });
    const rejectedTheatres = await Theatre.countDocuments({ approvalStatus: 'REJECTED' });
    const activeTheatres = await Theatre.countDocuments({ approvalStatus: 'APPROVED', isActive: true });

    // Theatre owners count
    const totalTheatreOwners = await User.countDocuments({ role: 'theatre_owner' });

    res.json({
      success: true,
      stats: {
        total: totalTheatres,
        pending: pendingTheatres,
        approved: approvedTheatres,
        rejected: rejectedTheatres,
        active: activeTheatres,
        totalOwners: totalTheatreOwners
      }
    });
  } catch (error) {
    console.error("Error fetching theatre stats:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching statistics", 
      error: error.message 
    });
  }
};

// @desc    Update user role (make someone a theatre owner)
// @route   PUT /api/admin/users/:userId/role
// @access  Admin
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'theatre_owner', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role"
      });
    }

    // Update in Clerk
    await clerkClient.users.updateUser(userId, {
      privateMetadata: { role }
    });

    // Update in MongoDB if user exists
    await User.findByIdAndUpdate(userId, { role }, { upsert: true });

    res.json({
      success: true,
      message: `User role updated to ${role}`
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error updating user role", 
      error: error.message 
    });
  }
};