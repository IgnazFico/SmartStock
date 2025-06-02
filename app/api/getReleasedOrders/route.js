import { NextResponse } from "next/server";
import connect from "../../../utils/db";

export async function GET() {
  try {
    const db = await connect();

    // Fetch all orders where status is NOT "Planned"
    const orders = await db
      .collection("production_order")
      .find({ status: { $ne: "Planned" } })
      .toArray();

    return NextResponse.json({ orders });
  } catch (err) {
    console.error("Failed to fetch production orders:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
