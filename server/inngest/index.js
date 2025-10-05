import { Inngest } from "inngest";
import connectDB from "../config/db.js";
import User from "../models/User.js";

// connect DB safely at import time
await connectDB();

// Create Inngest client
export const inngest = new Inngest({ id: "quickshow-app" });

// User Created Event
const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    try {
      const { id, first_name, last_name, email_addresses, image_url } = event.data;
      const userData = {
        _id: id,
        name: `${first_name} ${last_name}`,
        email: email_addresses[0].email_address,
        image: image_url,
      };
      await User.create(userData);
      console.log("✅ User created in DB:", userData.email);
    } catch (err) {
      console.error("❌ Error syncing user:", err.message);
    }
  }
);

// User Deleted Event
const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-with-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    try {
      const { id } = event.data;
      await User.findByIdAndDelete(id);
      console.log("🗑️ User deleted:", id);
    } catch (err) {
      console.error("❌ Error deleting user:", err.message);
    }
  }
);

// User Updated Event
const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    try {
      const { id, first_name, last_name, email_addresses, image_url } = event.data;
      const userData = {
        _id: id,
        name: `${first_name} ${last_name}`,
        email: email_addresses[0].email_address,
        image: image_url,
      };
      await User.findByIdAndUpdate(id, userData);
      console.log("🔄 User updated:", userData.email);
    } catch (err) {
      console.error("❌ Error updating user:", err.message);
    }
  }
);

export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdation];
