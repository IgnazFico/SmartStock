import { NextResponse } from "next/server";
import connect from "../../../utils/db";

export async function GET() {
  try {
    const db = await connect();
    const releasedOrders = await db
      .collection("production_order")
      .find({ status: "Released" })
      .toArray();

    return NextResponse.json({ orders: releasedOrders });
  } catch (err) {
    console.error("Failed to fetch released orders:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
