import { NextResponse } from "next/server";
import connect from "@/utils/db";

export async function POST(req) {
  const body = await req.json();
  const { prod_order_id, item_id, quantity, routing, order_date, due_date } =
    body;

  if (!prod_order_id || !item_id || !quantity || !routing) {
    return NextResponse.json(
      { message: "Missing required fields." },
      { status: 400 }
    );
  }

  try {
    const db = await connect();

    // 1. Insert into production_order
    await db.collection("production_order").insertOne({
      prod_order_id,
      item_id,
      quantity: Number(quantity),
      process_id: routing,
      order_date: new Date(order_date),
      due_date: new Date(due_date),
      status: "Planned",
    });
  } catch (err) {
    console.error("Error releasing production order:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
  return NextResponse.json({ message: "Production order saved." });
}
