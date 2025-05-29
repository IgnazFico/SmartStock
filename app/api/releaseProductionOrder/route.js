import { NextResponse } from "next/server";
import connect from "@/utils/db";

export async function POST(req) {
  const body = await req.json();
  const { prod_order_ID } = body;

  if (!prod_order_ID) {
    return NextResponse.json(
      { message: "Production Order Unavailable" },
      { status: 400 }
    );
  }

  try {
    const db = await connect();

    // 1. Update the production order's status to "Released"
    const result = await db
      .collection("production_order")
      .updateOne({ prod_order_ID }, { $set: { status: "Released" } });

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { message: "Production Order not found or already released." },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Production order released." });
  } catch (err) {
    console.error("Error releasing production order:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
