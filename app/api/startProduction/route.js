import { NextResponse } from "next/server";
import connect from "../../../utils/db";

export async function POST(req) {
  const { prod_order_ID } = await req.json();

  if (!prod_order_ID) {
    return NextResponse.json({ message: "Missing order ID" }, { status: 400 });
  }

  try {
    const db = await connect();
    await db
      .collection("production_order")
      .updateOne({ prod_order_ID }, { $set: { status: "In Progress" } });

    return NextResponse.json({ message: "Production started" });
  } catch (err) {
    console.error("Failed to start production:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
