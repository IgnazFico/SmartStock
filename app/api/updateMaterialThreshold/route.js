import { NextResponse } from "next/server";
import connect from "../../../utils/db";

export async function POST(req) {
  try {
    const { material_ID, threshold } = await req.json();
    if (!material_ID) {
      return NextResponse.json({ message: "material_ID is required" }, { status: 400 });
    }
    const db = await connect();
    const result = await db.collection("material").updateOne(
      { material_ID },
      { $set: { threshold: Number(threshold) } }
    );
    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Material not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Threshold updated" });
  } catch (error) {
    console.error("Error updating threshold:", error);
    return NextResponse.json({ message: "Error updating threshold" }, { status: 500 });
  }
}
