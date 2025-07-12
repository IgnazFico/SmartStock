export const dynamic = "force-dynamic";

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

    const response = NextResponse.json({ orders });
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (err) {
    console.error("Failed to fetch production orders:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
