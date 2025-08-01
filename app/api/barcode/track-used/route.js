import { NextResponse } from "next/server";
import connect from "@/utils/db";

export async function POST(request) {
  try {
    const db = await connect();
    const trackingCol = db.collection("barcode_tracking");

    const body = await request.json();
    const {
      type, // "raw_material", "production", atau "finish_good"
      po_ID,         // hanya jika type === "raw_material"
      prod_order_id, // hanya jika type === "production" atau "finish_good"
      used_at = new Date(),
    } = body;

    // Validasi tipe
    const allowedTypes = ["raw_material", "production", "finish_good"];
    if (!type || !allowedTypes.includes(type)) {
      return NextResponse.json({ message: "Tipe tidak valid" }, { status: 400 });
    }

    // Data yang akan dicatat
    const dataToInsert = {
      type,
      used_at: new Date(used_at),
    };

    // Sesuaikan isi data berdasarkan tipe barcode
    if (type === "raw_material") {
      if (!po_ID) return NextResponse.json({ message: "po_ID diperlukan" }, { status: 400 });
      dataToInsert.po_ID = po_ID;
    } else {
      if (!prod_order_id) return NextResponse.json({ message: "prod_order_id diperlukan" }, { status: 400 });
      dataToInsert.prod_order_id = prod_order_id;
    }

    await trackingCol.insertOne(dataToInsert);
    return NextResponse.json({ message: "Data berhasil dicatat." });
  } catch (err) {
    console.error("🔥 Error POST /track-used:", err);
    return NextResponse.json({ message: "Gagal mencatat data" }, { status: 500 });
  }
}
