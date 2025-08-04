import { NextResponse } from "next/server";
import connect from "../../../utils/db";

export async function POST(req) {
  try {
    const body = await req.json();
    const { material_ID, material, description, cost, unit, lead_time, threshold } = body;
    if (!material_ID || !material) {
      return NextResponse.json({ message: "material_ID and material are required" }, { status: 400 });
    }
    const db = await connect();
    // Prevent duplicate material_ID
    const exists = await db.collection("material").findOne({ material_ID });
    if (exists) {
      return NextResponse.json({ message: "Material ID already exists" }, { status: 400 });
    }
    const doc = {
      material_ID,
      material,
      description: description || "",
      cost: cost ? Number(cost) : 0,
      unit: unit || "",
      lead_time: lead_time || "",
      threshold: threshold ? Number(threshold) : 0,
    };
    await db.collection("material").insertOne(doc);
    return NextResponse.json(doc);
  } catch (error) {
    console.error("Error inserting material:", error);
    return NextResponse.json({ message: "Error inserting material" }, { status: 500 });
  }
}
