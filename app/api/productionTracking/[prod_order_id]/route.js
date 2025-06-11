import connect from "../../../../utils/db";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const { prod_order_id } = params;

  try {
    const db = await connect();

    const tracking = await db
      .collection("production_tracking")
      .findOne({ prod_order_id });

    return NextResponse.json(tracking);
  } catch (err) {
    console.error("Error fetching production tracking data:", err);
    return NextResponse.json(
      { message: "Failed to retrieve tracking data." },
      { status: 500 }
    );
  }
}
