import User from "../model/User.js";
import { generateToken, usernameOrEmail } from "../utils/authUtils.js";

export async function register(req, res) {
  let { username, email, password } = req.body;
  email = email.toLowerCase();
  var user = await User.findOne({ email });
  if (user) {
    return res.status(400).json({ msg: "User already exists" });
  }
  var user = await User.create({
    username,
    email,
    passwordHash: password, 
  });

  const payload = { id: user._id, username: user.username };
  const token = generateToken(payload);

  res.json({ token, user: payload });
}

export async function login(req, res) {
  const { loginIdentifier, password } = req.body;
  if (!loginIdentifier || !password) {
    return res.status(400).json({ msg: "All fields are required" });
  }
  const user = await User.findOne(usernameOrEmail(loginIdentifier));
  if (!user) {
    return res.status(401).json({ msg: "Invalid credentials" });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

  const payload = { id: user._id, username: user.username };
  const token = generateToken(payload);

  res.json({ token, user: payload });

}
