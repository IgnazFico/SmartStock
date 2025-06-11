import connect from "../../../utils/db";
import { NextResponse } from "next/server";

export async function POST(req) {
  const payload = await req.json();

  try {
    const db = await connect();

    const insertOps = payload.map(async (entry) => {
      const {
        prod_order_id,
        process_id,
        materials,
        output_quantity,
        status,
        remarks,
      } = entry;

      await db.collection("production_tracking").insertOne({
        prod_order_id,
        process_id,
        output_quantity: Number(output_quantity),
        status,
        remarks,
        time_submitted: new Date(),
      });

      // Normalize materials and insert into production_material_tracking
      const materialDocs = materials.map((material) => ({
        prod_order_id,
        process_id,
        material_id: material.material_id,
        quantity: Number(material.quantity),
      }));

      await db
        .collection("production_material_tracking")
        .insertMany(materialDocs);
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
        { prod_order_id: payload[0].prod_order_id },
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
