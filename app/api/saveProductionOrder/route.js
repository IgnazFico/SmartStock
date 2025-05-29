import { NextResponse } from "next/server";
import connect from "@/utils/db";

export async function POST(req) {
  const body = await req.json();
  const {
    prod_order_ID,
    item_id,
    quantity,
    routing,
    order_date,
    due_date,
    operations = [],
  } = body;

  if (!prod_order_ID || !item_id || !quantity || !routing) {
    return NextResponse.json(
      { message: "Missing required fields." },
      { status: 400 }
    );
  }

  try {
    const db = await connect();

    // 1. Insert into production_order
    await db.collection("production_order").insertOne({
      prod_order_ID,
      item_id,
      quantity: Number(quantity),
      order_date: new Date(order_date),
      due_date: new Date(due_date),
      status: "Planned",
    });

    // 2. (Optional) Log initial operations
    for (let i = 0; i < operations.length; i++) {
      const op = operations[i];
      const operationStep = (i + 1) * 10;
      const nextStep = operations[i + 1] ? (i + 2) * 10 : 0;

      await db.collection("production_tracking").insertOne({
        prod_order_id: prod_order_ID,
        process_id: `${routing}-${operationStep}`,
        input_quantity: 0,
        output_quantity: 0,
        status: "Planned",
        remarks: "",
        operation: operationStep,
        next_operation: nextStep,
        time_submitted: new Date(),
      });
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
