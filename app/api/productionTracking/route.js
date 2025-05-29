import connect from "../../../utils/db";
import { NextResponse } from "next/server";

export async function POST(req) {
  const payload = await req.json();

  try {
    const db = await connect();

    const insertOps = payload.map((entry) => {
      const {
        prod_order_id,
        process_id,
        input_quantity,
        output_quantity,
        status,
        remarks,
      } = entry;

      return db.collection("production_tracking").insertOne({
        prod_order_id,
        process_id,
        input_quantity: Number(input_quantity),
        output_quantity: Number(output_quantity),
        status,
        remarks,
        time_submitted: new Date(),
      });
    });

    await Promise.all(insertOps);

    await db
      .collection("production_tracking")
      .updateMany(
        { prod_order_id: payload[0].prod_order_id },
        { $set: { status: "Completed" } }
      );

    await db
      .collection("production_order")
      .updateOne(
        { prod_order_ID: payload[0].prod_order_id },
        { $set: { status: "Completed" } }
      );

    return NextResponse.json({
      message: "Tracking saved and order marked as Completed.",
    });
  } catch (err) {
    console.error("Error in production tracking:", err);
    return NextResponse.json(
      { message: "Error saving production tracking data." },
      { status: 500 }
    );
  }
}
