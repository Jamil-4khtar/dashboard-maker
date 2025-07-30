import mongoose, { Schema } from "mongoose"
import bcrypt from 'bcryptjs'

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  passwordHash: {
    type: String,
    required: true
  }
}, {timestamps: true})


UserSchema.pre("save", async function (next) {
  console.log(this)
  if(!this.isModified("passwordHash")) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 10)
  next()
})

UserSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash)
}

const User = mongoose.model("User", UserSchema);
export default User
