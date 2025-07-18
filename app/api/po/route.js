import { NextResponse } from "next/server";
import connect from "../../../utils/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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
      status: item.status || "",
      received_date: item.received_date || null,
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
    const session = await getServerSession(authOptions);

    if (
      !session ||
      (session.user.department !== "purchasing" &&
        session.user.role !== "admin")
    ) {
      return NextResponse.json(
        { message: "Unauthorized. Access restricted to purchasing or admin." },
        { status: 403 }
      );
    }

    const db = await connect();
    const poCollection = db.collection("purchase_orders");
    const poItemsCollection = db.collection("purchase_orders_items");
    const prCollection = db.collection("purchase_requests");

    const newPO = await req.json();

    // Validasi wajib
    if (
      !newPO.order_date ||
      !newPO.supplier_ID ||
      !newPO.pr_ID ||
      !Array.isArray(newPO.items) ||
      newPO.items.length === 0
    ) {
      return NextResponse.json(
        { message: "order_date, supplier_ID, pr_ID, dan items wajib diisi" },
        { status: 400 }
      );
    }

    // Generate PO ID otomatis
    const lastPO = await poCollection
      .find()
      .sort({ po_ID: -1 })
      .limit(1)
      .toArray();
    const newNumber =
      lastPO.length > 0 ? parseInt(lastPO[0].po_ID.slice(2)) + 1 : 1;
    const newPO_ID = `PO${newNumber.toString().padStart(4, "0")}`;

    // Simpan header PO
    const poToInsert = {
      po_ID: newPO_ID,
      order_date: new Date(newPO.order_date),
      supplier_ID: newPO.supplier_ID,
      status: newPO.status || "pending",
      received_date: newPO.received_date || null,
    };

    const poResult = await poCollection.insertOne(poToInsert);
    if (!poResult.acknowledged) {
      throw new Error("Gagal menyimpan data PO ke database.");
    }

    // Simpan detail items ke po_items dengan referensi po_ID
    const itemsToInsert = newPO.items.map((item) => ({
      po_ID: newPO_ID,
      material_ID: item.material_ID,
      quantity: Number(item.quantity),
      request_item_ID: item.request_item_ID || null, // optional
    }));

    const itemsResult = await poItemsCollection.insertMany(itemsToInsert);
    if (itemsResult.insertedCount !== itemsToInsert.length) {
      console.warn("Tidak semua item PO berhasil disimpan.");
    }

    return NextResponse.json(
      { message: "PO dan items berhasil disimpan", po_ID: newPO_ID },
      { status: 201 }
    );
  } catch (err) {
    console.error("🔥 API Error POST /api/po:", err);
    return NextResponse.json(
      { message: "Gagal menyimpan data purchase order" },
      { status: 500 }
    );
  }
}
