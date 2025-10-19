import mongoose from "mongoose";
import Theatre from "../models/Theatre.js";
import Show from "../models/Show.js";

// @desc    Create a new theatre
// @route   POST /api/theatre
// @access  Theatre Owner
export const createTheatre = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { name, address, contact, policies } = req.body;

    // Validation
    if (!name || !address || !contact) {
      return res.status(400).json({ 
        success: false, 
        message: "Please provide all required fields" 
      });
    }

    // Check if theatre owner already has a theatre with this name
    const existingTheatre = await Theatre.findOne({ owner: userId, name });
    if (existingTheatre) {
      return res.status(400).json({
        success: false,
        message: "You already have a theatre with this name"
      });
    }

    const theatre = await Theatre.create({
      name,
      owner: userId,
      address,
      contact,
      policies: policies || {}
    });

    res.status(201).json({
      success: true,
      message: "Theatre created successfully. Pending admin approval.",
      theatre
    });
  } catch (error) {
    console.error("Error creating theatre:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error creating theatre", 
      error: error.message 
    });
  }
};

// @desc    Get all theatres for the logged-in owner
// @route   GET /api/theatre/my-theatres
// @access  Theatre Owner
export const getMyTheatres = async (req, res) => {
  try {
    const { userId } = req.auth;

    const theatres = await Theatre.find({ owner: userId }).sort({ createdAt: -1 });

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

// @desc    Get single theatre details
// @route   GET /api/theatre/:id
// @access  Theatre Owner (own theatres) or Public (approved only)
export const getTheatreById = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.auth;

    const theatre = await Theatre.findById(id);

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: "Theatre not found"
      });
    }

    // If not owner, only show approved theatres
    if (theatre.owner !== userId && theatre.approvalStatus !== 'APPROVED') {
      return res.status(403).json({
        success: false,
        message: "Theatre not accessible"
      });
    }

    res.json({
      success: true,
      theatre
    });
  } catch (error) {
    console.error("Error fetching theatre:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching theatre", 
      error: error.message 
    });
  }
};

// @desc    Update theatre details
// @route   PUT /api/theatre/:id
// @access  Theatre Owner
export const updateTheatre = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.auth;
    const { name, address, contact, policies, isActive } = req.body;

    const theatre = await Theatre.findById(id);

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: "Theatre not found"
      });
    }

    // Only owner can update
    if (theatre.owner !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this theatre"
      });
    }

    // Update fields
    if (name) theatre.name = name;
    if (address) theatre.address = { ...theatre.address, ...address };
    if (contact) theatre.contact = { ...theatre.contact, ...contact };
    if (policies) theatre.policies = { ...theatre.policies, ...policies };
    if (typeof isActive === 'boolean') theatre.isActive = isActive;

    await theatre.save();

    res.json({
      success: true,
      message: "Theatre updated successfully",
      theatre
    });
  } catch (error) {
    console.error("Error updating theatre:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error updating theatre", 
      error: error.message 
    });
  }
};

// @desc    Delete theatre
// @route   DELETE /api/theatre/:id
// @access  Theatre Owner
export const deleteTheatre = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.auth;

    const theatre = await Theatre.findById(id);

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: "Theatre not found"
      });
    }

    // Only owner can delete
    if (theatre.owner !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this theatre"
      });
    }

    // Check if there are active shows
    const activeShows = await Show.countDocuments({ 
      theatre: id,
      showDateTime: { $gte: new Date() }
    });

    if (activeShows > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete theatre with active shows"
      });
    }

    await theatre.deleteOne();

    res.json({
      success: true,
      message: "Theatre deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting theatre:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error deleting theatre", 
      error: error.message 
    });
  }
};

// @desc    Get all approved theatres (for users)
// @route   GET /api/theatre/approved
// @access  Public
export const getApprovedTheatres = async (req, res) => {
  try {
    const { city } = req.query;

    const filter = { 
      approvalStatus: 'APPROVED', 
      isActive: true 
    };

    if (city) {
      filter['address.city'] = new RegExp(city, 'i');
    }

    const theatres = await Theatre.find(filter)
      .select('-rejectionReason -approvedBy')
      .sort({ name: 1 });

    res.json({
      success: true,
      count: theatres.length,
      theatres
    });
  } catch (error) {
    console.error("Error fetching approved theatres:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching theatres", 
      error: error.message 
    });
  }
};

// @desc    Create show for a theatre
// @route   POST /api/theatre/:theatreId/shows
// @access  Theatre Owner
export const createShow = async (req, res) => {
  try {
    const { theatreId } = req.params;
    const { userId } = req.auth;
    const { movie, hallName, showDateTime, showPrice, seatConfiguration } = req.body;

    // Validate theatre ownership
    const theatre = await Theatre.findById(theatreId);
    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: "Theatre not found"
      });
    }

    if (theatre.owner !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to create shows for this theatre"
      });
    }

    if (theatre.approvalStatus !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: "Theatre must be approved before creating shows"
      });
    }

    // Validation
    if (!movie || !hallName || !showDateTime || !showPrice || !seatConfiguration) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields"
      });
    }

    const totalSeats = seatConfiguration.rows * seatConfiguration.seatsPerRow;

    const show = await Show.create({
      movie,
      theatre: theatreId,
      hallName,
      showDateTime,
      showPrice,
      totalSeats,
      seatConfiguration
    });

    // Update theatre's total halls count if needed
    const uniqueHalls = await Show.distinct('hallName', { theatre: theatreId });
    theatre.totalHalls = uniqueHalls.length;
    await theatre.save();

    res.status(201).json({
      success: true,
      message: "Show created successfully",
      show
    });
  } catch (error) {
    console.error("Error creating show:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error creating show", 
      error: error.message 
    });
  }
};

// @desc    Get all shows for a theatre
// @route   GET /api/theatre/:theatreId/shows
// @access  Public (approved theatres) or Theatre Owner
export const getTheatreShows = async (req, res) => {
  try {
    const { theatreId } = req.params;
    const { userId } = req.auth;

    const theatre = await Theatre.findById(theatreId);
    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: "Theatre not found"
      });
    }

    if (theatre.owner !== userId && theatre.approvalStatus !== 'APPROVED') {
      return res.status(403).json({
        success: false,
        message: "Theatre not accessible"
      });
    }

    // Get shows without populate first
    const shows = await Show.find({ theatre: theatreId })
      .sort({ showDateTime: 1 })
      .lean();

    // Simply return movie field as movieName
    const processedShows = shows.map(show => ({
      ...show,
      movieName: show.movie  // Whatever is in movie field
    }));

    res.json({
      success: true,
      count: processedShows.length,
      shows: processedShows
    });
  } catch (error) {
    console.error("Error fetching shows:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching shows", 
      error: error.message 
    });
  }
};

// @desc    Update show
// @route   PUT /api/theatre/:theatreId/shows/:showId
// @access  Theatre Owner
export const updateShow = async (req, res) => {
  try {
    const { theatreId, showId } = req.params;
    const { userId } = req.auth;
    const updates = req.body;

    // Validate theatre ownership
    const theatre = await Theatre.findById(theatreId);
    if (!theatre || theatre.owner !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });
    }

    const show = await Show.findOne({ _id: showId, theatre: theatreId });
    if (!show) {
      return res.status(404).json({
        success: false,
        message: "Show not found"
      });
    }

    // Update allowed fields
    const allowedUpdates = ['hallName', 'showDateTime', 'showPrice', 'seatConfiguration'];
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        show[key] = updates[key];
      }
    });

    // Recalculate total seats if seat configuration changed
    if (updates.seatConfiguration) {
      show.totalSeats = updates.seatConfiguration.rows * updates.seatConfiguration.seatsPerRow;
    }

    await show.save();

    res.json({
      success: true,
      message: "Show updated successfully",
      show
    });
  } catch (error) {
    console.error("Error updating show:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error updating show", 
      error: error.message 
    });
  }
};

// @desc    Delete show
// @route   DELETE /api/theatre/:theatreId/shows/:showId
// @access  Theatre Owner
export const deleteShow = async (req, res) => {
  try {
    const { theatreId, showId } = req.params;
    const { userId } = req.auth;

    // Validate theatre ownership
    const theatre = await Theatre.findById(theatreId);
    if (!theatre || theatre.owner !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });
    }

    const show = await Show.findOne({ _id: showId, theatre: theatreId });
    if (!show) {
      return res.status(404).json({
        success: false,
        message: "Show not found"
      });
    }

    await show.deleteOne();

    res.json({
      success: true,
      message: "Show deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting show:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error deleting show", 
      error: error.message 
    });
  }
};

// @desc    Get single show by ID (for booking)
// @route   GET /api/theatre/show/:showId
// @access  Public
export const getShowById = async (req, res) => {
  try {
    const { showId } = req.params;

    const show = await Show.findById(showId)
      .populate('theatre')
      .lean();

    if (!show) {
      return res.status(404).json({
        success: false,
        message: "Show not found"
      });
    }

    // Add movieName for display
    const processedShow = {
      ...show,
      movieName: show.movie || 'Unknown Movie'
    };

    res.json({
      success: true,
      show: processedShow
    });
  } catch (error) {
    console.error("Error fetching show:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching show", 
      error: error.message 
    });
  }
};
