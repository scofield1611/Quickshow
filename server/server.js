import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/db.js'
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js"
import showRouter from './routes/showRoutes.js'
import bookingRouter from './routes/bookingRoutes.js'
import adminRouter from './routes/adminRoutes.js'
import userRouter from './routes/userRoutes.js'
import theatreRouter from './routes/theatreRoutes.js'
import { stripeWebhooks } from './controllers/stripeWebhook.js'


const app = express()
const port = 3000

await connectDB()
//stripe webhook
app.use('/api/stripe', express.raw({type: 'application/json'}),stripeWebhooks)

app.use(express.json())
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(clerkMiddleware())
// Routes
app.get('/', (req,res) => res.send("Server Is Live"))
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use('/api/shows',showRouter)
app.use('/api/booking',bookingRouter)
app.use('/api/admin', adminRouter)
app.use('/api/user', userRouter)
app.use('/api/theatre', theatreRouter)

app.listen(port, ()=> (
    console.log(`Server listening at http://localhost:${(port)} `))
)
