import { NextResponse } from "next/server";
import connect from "@/utils/db";

export async function GET() {
  try {
    const db = await connect();
    const prodCol = db.collection("production_order"); // <- gunakan collection PRD
    const trackCol = db.collection("barcode_tracking");

    // Ambil Production Order yang sudah digunakan
    const usedProdOrders = await trackCol.distinct("prod_order_id", { type: "production" });

    // Ambil Production Order yang belum digunakan
    const availableOrders = await prodCol
      .find({status: "Planned", prod_order_id: { $nin: usedProdOrders } })
      .project({ prod_order_id: 1, item_id: 1, quantity: 1, _id: 0 })
      .toArray();

    // Mapping agar konsisten dengan front-end
    const formatted = availableOrders.map(order => ({
      prod_order_id: order.prod_order_id,
      material_ID: order.item_id,
      quantity: order.quantity,
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("🔥 Error GET /available-prod-orders:", err);
    return NextResponse.json({ message: "Error fetching production orders" }, { status: 500 });
  }
}
