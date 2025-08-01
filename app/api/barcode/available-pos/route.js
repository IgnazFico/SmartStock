import { NextResponse } from "next/server";
import connect from "@/utils/db";

export async function GET() {
  try {
    const db = await connect();
    const poCol = db.collection("purchase_orders");
    const trackCol = db.collection("barcode_tracking");

    // Ambil PO yang sudah digunakan
    const usedPOs = await trackCol.distinct("po_ID", { type: "raw_material" });

    // Ambil PO yang belum digunakan & status Received
    const availablePOs = await poCol
      .find({ status: "Received", po_ID: { $nin: usedPOs } })
      .project({ po_ID: 1, material_ID: 1, quantity: 1, _id: 0 })
      .toArray();

    return NextResponse.json(availablePOs);
  } catch (err) {
    console.error("🔥 Error GET /available-pos:", err);
    return NextResponse.json({ message: "Fetching data erorr" }, { status: 500 });
  }
}
