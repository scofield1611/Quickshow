import express from "express";
import {
  createTheatre,
  getMyTheatres,
  getTheatreById,
  updateTheatre,
  deleteTheatre,
  getApprovedTheatres,
  createShow,
  getTheatreShows,
  updateShow,
  deleteShow,
  getShowById
} from "../controllers/theatreController.js";
import { protectTheatreOwner, protectUser } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.get("/approved", getApprovedTheatres);

// Theatre Owner routes
router.post("/", protectTheatreOwner, createTheatre);
router.get("/my-theatres", protectTheatreOwner, getMyTheatres);
router.get("/:id", protectUser, getTheatreById);
router.put("/:id", protectTheatreOwner, updateTheatre);
router.delete("/:id", protectTheatreOwner, deleteTheatre);

// Show management routes
router.post("/:theatreId/shows", protectTheatreOwner, createShow);
router.get("/:theatreId/shows", protectUser, getTheatreShows);
router.put("/:theatreId/shows/:showId", protectTheatreOwner, updateShow);
router.delete("/:theatreId/shows/:showId", protectTheatreOwner, deleteShow);

// Get single show by ID (for booking)
router.get("/show/:showId", getShowById);

export default router;
