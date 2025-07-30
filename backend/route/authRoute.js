import { Router } from "express";
import { login, register } from "../controller/authController.js";
import passport from "passport";

const authRouter = Router()

authRouter.post("/register", register)
authRouter.post("/login", login)

authRouter.use(passport.authenticate("jwt", { session: false }))
authRouter.get("/getme", (req, res) => {
  res.send("Got em")
})

export default authRouter