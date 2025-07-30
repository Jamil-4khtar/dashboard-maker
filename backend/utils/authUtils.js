import jwt from 'jsonwebtoken'

export function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d"});
}

export function usernameOrEmail(loginIdentifier) {
  let isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginIdentifier);

  if (isEmail) {
    return {email: loginIdentifier.toLowerCase()}
  } else {
    return {username: loginIdentifier}
  }
}