import { NextResponse } from "next/server";
import connect from "@/utils/db";

export async function GET() {
  try {
    const db = await connect();
    const poCol = db.collection("purchase_orders");
    const poItemsCol = db.collection("purchase_orders_items");
    const trackCol = db.collection("barcode_tracking");

    // Ambil PO yang sudah digunakan
    const usedPOs = await trackCol.distinct("po_ID", { type: "raw_material" });

    // Get open/received purchase orders (status: Received)
    const openOrders = await poCol
      .find({ status: "Received", po_ID: { $nin: usedPOs } })
      .toArray();
    const poIDs = openOrders.map((po) => po.po_ID);

    // Get items for these POs
    const items = await poItemsCol.find({ po_ID: { $in: poIDs } }).toArray();
    // Map PO to its items
    const result = items.map((item) => ({
      po_ID: item.po_ID,
      material_ID: item.material_ID,
      quantity: item.quantity,
    }));
    return NextResponse.json(result);
  } catch (err) {
    console.error("🔥 Error GET /available-pos:", err);
    return NextResponse.json(
      { message: "Fetching data erorr" },
      { status: 500 }
    );
  }
}
