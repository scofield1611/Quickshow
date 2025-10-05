import { Inngest } from "inngest";
import User from "../models/User.js";
import { connectDB } from "../db.js"; // ✅ import DB connection

export const inngest = new Inngest({ id: "my-app" });

// User Creation Function
const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    await connectDB(); // ✅ connect before using model
    const { id, first_name, last_name, email_addresses, image_url } = event.data;

    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      name: `${first_name} ${last_name}`,
      image: image_url,
    };

    await User.create(userData);
    return "User added successfully!";
  }
);

// User Deletion Function
const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-with-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    await connectDB(); // ✅ connect before delete
    const { id } = event.data;
    await User.findByIdAndDelete(id);
    return "User deleted successfully!";
  }
);

// User Update Function
const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    await connectDB(); // ✅ connect before update
    const { id, first_name, last_name, email_addresses, image_url } = event.data;

    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      name: `${first_name} ${last_name}`,
      image: image_url,
    };

    await User.findByIdAndUpdate(id, userData);
    return "User updated successfully!";
  }
);

export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdation];
