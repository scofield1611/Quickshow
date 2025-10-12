import stripe from "stripe";
import Booking from "../models/Booking.js";

export const stripeWebhooks = async (request, response) => {
  const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
  const sig = request.headers["stripe-signature"];

  let event;

  try {
    // 1. Verify the event is genuinely from Stripe
    event = stripeInstance.webhooks.constructEvent(
      request.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // 2. Handle the verified event
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        const sessionList = await stripeInstance.checkout.sessions.list({
          payment_intent: paymentIntent.id,
        });

        const session = sessionList.data[0];
        const { bookingId } = session.metadata;

        // Update your database
        await Booking.findByIdAndUpdate(bookingId, {
          isPaid: true,
          paymentLink: "",
        });

        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // 3. Return a 200 response to Stripe to acknowledge receipt
    response.json({ received: true });
    
  } catch (error) {
    // Catch any errors from verification or your logic
    console.error("Webhook handler error:", error);
    return response.status(400).send(`Webhook Error: ${error.message}`);
  }
};