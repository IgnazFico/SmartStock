// models/material.js
import mongoose from "mongoose";

const materialSchema = new mongoose.Schema({
  material_ID: String,
  material: String,
  description: String,
  cost: Number,
  unit: String,
  lead_time: Number,
});

const Material = mongoose.models.Material || mongoose.model("Material", materialSchema, "material");

export default Material;
