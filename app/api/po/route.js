import { NextResponse } from "next/server";
import connect from "../../../utils/db";

export async function GET() {
  try {
    const db = await connect();
    const collection = db.collection("purchase_orders");

    const records = await collection.find({}).toArray();

    const formatted = records.map((item) => ({
      po_ID: item.po_ID || "",
      order_date: item.order_date
        ? new Date(item.order_date).toISOString().split("T")[0]
        : "",
      supplier_ID: item.supplier_ID || "",
      material: item.material,
      supplier: item.supplier,
      material_ID: item.material_ID || "",
      quantity: Number(item.quantity) || 0,
      status: item.status,
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("🔥 API Error GET /api/po:", err);
    return NextResponse.json(
      { message: "Gagal mengambil data purchase order" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const db = await connect();
    const collection = db.collection("purchase_orders");
    const prCollection = db.collection("purchase_requests");

    const newPO = await req.json();

    // Validasi wajib termasuk pr_ID
    if (
      !newPO.order_date ||
      !newPO.supplier_ID ||
      !newPO.material_ID ||
      !newPO.quantity ||
      !newPO.pr_ID
    ) {
      return NextResponse.json(
        { message: "Semua field wajib diisi termasuk pr_ID" },
        { status: 400 }
      );
    }

    // Buat PO ID otomatis
    const lastPO = await collection.find().sort({ po_ID: -1 }).limit(1).toArray();
    const newNumber = lastPO.length > 0 ? parseInt(lastPO[0].po_ID.slice(2)) + 1 : 1;
    const newPO_ID = `PO${newNumber.toString().padStart(4, "0")}`;

    // Buat data PO yang akan disimpan tanpa pr_ID
    const poToInsert = {
      po_ID: newPO_ID,
      order_date: new Date(newPO.order_date),
      supplier_ID: newPO.supplier_ID,
      material_ID: newPO.material_ID,
      quantity: Number(newPO.quantity),
      status: newPO.status || "pending",
      received_date: newPO.received_date,
    };

    const result = await collection.insertOne(poToInsert);

    if (!result.acknowledged) {
      throw new Error("Gagal menyimpan data PO ke database.");
    }

    // Update status PR jadi converted
    try {
      const updateResult = await prCollection.updateOne(
        { pr_ID: newPO.pr_ID },
        { $set: { status: "converted" } }
      );

      if (updateResult.modifiedCount === 0) {
        console.warn(`PR dengan pr_ID=${newPO.pr_ID} tidak ditemukan atau status tidak diperbarui.`);
      }
    } catch (errUpdate) {
      console.error("🔥 Error update status PR:", errUpdate);
    }

    // Response PO baru
    const responseData = {
      ...poToInsert,
      _id: result.insertedId,
    };

    return NextResponse.json(responseData, { status: 201 });
  } catch (err) {
    console.error("🔥 API Error POST /api/po:", err);
    return NextResponse.json(
      { message: "Gagal menyimpan data purchase order" },
      { status: 500 }
    );
  }
}

