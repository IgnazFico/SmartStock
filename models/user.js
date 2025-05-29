// models/user.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  users_ID: String,
  email: String,
  password: String,
  name: String,
  role: String,
  department: String,
  NIK: String,
  position: String,
});

export default mongoose.models.User || mongoose.model("User", userSchema);
