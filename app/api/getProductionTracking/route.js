import connect from "@/utils/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const db = await connect();
    const tracking = await db
      .collection("production_tracking")
      .find({})
      .toArray();

    return NextResponse.json(tracking);
  } catch (error) {
    console.error("Error fetching production_tracking:", error);
    return NextResponse.json(
      { error: "Failed to fetch production tracking data" },
      { status: 500 }
    );
  }
}
