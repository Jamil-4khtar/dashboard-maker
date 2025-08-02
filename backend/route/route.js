import { Router } from 'express'
import authRouter from './authRoute.js'
import dashboardRouter from './dashboardRoute.js'

const router = Router()

router.use("/auth", authRouter)
router.use("/dashboard", dashboardRouter)


export default router