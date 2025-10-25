import { clerkClient} from "@clerk/express";

export const protectAdmin = async (req, res, next) => {
  try {
    const { userId } = req.auth();

    const user = await clerkClient.users.getUser(userId);

    if (user.privateMetadata.role !== 'admin') {
      return res.json({ success: false, message: "not authorized" });
    }

    next();
  } catch (error) {
    return res.json({ success: false, message: "not authorized" });
  }
};

export const protectTheatreOwner = async (req, res, next) => {
  try {
    const { userId } = req.auth();

    const user = await clerkClient.users.getUser(userId);

    // Allow both theatre_owner and admin
    if (user.privateMetadata.role !== 'theatre_owner' && user.privateMetadata.role !== 'admin') {
      return res.json({ success: false, message: "not authorized - theatre owner access required" });
    }

    next();
  } catch (error) {
    return res.json({ success: false, message: "not authorized" });
  }
};

export const protectUser = async (req, res, next) => {
  try {
    const { userId } = req.auth();

    if (!userId) {
      return res.json({ success: false, message: "not authorized - please login" });
    }

    next();
  } catch (error) {
    return res.json({ success: false, message: "not authorized" });
  }
};
