import express from "express";
import { protectAdmin } from "../middleware/auth.js";
import {
  getAllBookings,
  getAllShows,
  getDashboardData,
  isAdmin,
  getPendingTheatres,
  getAllTheatres,
  approveTheatre,
  rejectTheatre,
  getTheatreStats,
  updateUserRole
} from "../controllers/adminController.js";

const adminRouter = express.Router();

// Existing admin routes
adminRouter.get('/is-admin', protectAdmin, isAdmin);
adminRouter.get('/dashboard', protectAdmin, getDashboardData);
adminRouter.get('/all-shows', protectAdmin, getAllShows);
adminRouter.get('/all-bookings', protectAdmin, getAllBookings);

// Theatre management routes
adminRouter.get("/theatres/pending", protectAdmin, getPendingTheatres);
adminRouter.get("/theatres/stats", protectAdmin, getTheatreStats);
adminRouter.get("/theatres", protectAdmin, getAllTheatres);
adminRouter.put("/theatres/:id/approve", protectAdmin, approveTheatre);
adminRouter.put("/theatres/:id/reject", protectAdmin, rejectTheatre);

// User role management
adminRouter.put("/users/:userId/role", protectAdmin, updateUserRole);

export default adminRouter;