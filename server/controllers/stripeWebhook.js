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

    console.log(`📨 Received webhook event: ${event.type}`);

    // 2. Handle the verified event
    switch (event.type) {
      case "checkout.session.completed": {
        // This is the primary event for Checkout Sessions
        const session = event.data.object;
        const { bookingId } = session.metadata;
        
        console.log("📋 Session details:", {
          sessionId: session.id,
          bookingId: bookingId,
          paymentStatus: session.payment_status,
          amount: session.amount_total
        });

        if (session.payment_status === "paid") {
          // Update your database
          const updatedBooking = await Booking.findByIdAndUpdate(
            bookingId, 
            {
              isPaid: true,
              paymentLink: "",
            },
            { new: true } // Return the updated document
          );

          if (updatedBooking) {
            console.log(`✅ Booking ${bookingId} marked as paid successfully`);
          } else {
            console.error(`❌ Booking ${bookingId} not found in database`);
          }
        } else {
          console.log(`⚠️ Payment status is ${session.payment_status}, not marking as paid`);
        }

        break;
      }
      case "payment_intent.succeeded": {
        // Backup handler for payment intent events
        const paymentIntent = event.data.object;
        const sessionList = await stripeInstance.checkout.sessions.list({
          payment_intent: paymentIntent.id,
        });
        
        console.log("💳 Payment Intent succeeded:", {
          paymentIntentId: paymentIntent.id,
          sessionsFound: sessionList.data.length
        });
    
        if (sessionList.data.length > 0) {
          const session = sessionList.data[0];
          const { bookingId } = session.metadata;

          if (bookingId) {
            // Update your database
            const updatedBooking = await Booking.findByIdAndUpdate(
              bookingId,
              {
                isPaid: true,
                paymentLink: "",
              },
              { new: true }
            );
            
            if (updatedBooking) {
              console.log(`✅ Booking ${bookingId} marked as paid via payment_intent`);
            } else {
              console.error(`❌ Booking ${bookingId} not found in database`);
            }
          } else {
            console.warn("⚠️ No bookingId found in session metadata");
          }
        }

        break;
      }
      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    // 3. Return a 200 response to Stripe to acknowledge receipt
    response.json({ received: true });
    
  } catch (error) {
    // Catch any errors from verification or your logic
    console.error("❌ Webhook handler error:", error.message);
    console.error("Full error:", error);
    return response.status(400).send(`Webhook Error: ${error.message}`);
  }
};