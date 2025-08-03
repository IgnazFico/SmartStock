import connect from "@/utils/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const db = await connect();
    const materials = await db
      .collection("production_material_tracking")
      .find({})
      .toArray();

    return NextResponse.json(materials);
  } catch (error) {
    console.error("Error fetching production_material_tracking:", error);
    return NextResponse.json(
      { error: "Failed to fetch production material tracking data" },
      { status: 500 }
    );
  }
}
