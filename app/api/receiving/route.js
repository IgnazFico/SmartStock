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
      material_ID: item.material_ID || "",
      quantity: Number(item.quantity) || 0,
      received_date: item.received_date || "",
      status: item.status || "",
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("🔥 API Error GET /api/receiving:", err);
    return NextResponse.json(
      { message: "Gagal mengambil data purchase order" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.department !== "logistics") {
      return NextResponse.json(
        { message: "Unauthorized. Only logistics can update receiving." },
        { status: 403 }
      );
    }

    const { po_ID, received_date, items } = await request.json();

    if (!po_ID || !items || items.length === 0) {
      return NextResponse.json(
        { message: "po_ID dan items required!" },
        { status: 400 }
      );
    }

    // Format tanggal jadi YYYY-MM-DD
    const formattedDate = new Date(received_date).toISOString().split("T")[0];

    const db = await connect();
    const itemsCollection = db.collection("purchase_orders_items");
    const poCollection = db.collection("purchase_orders");

    // Update received_qty tiap item
    for (const { material_ID, qty } of items) {
      const item = await itemsCollection.findOne({ po_ID, material_ID });
      const currentReceived = item.received_qty || 0;
      const maxQty = item.quantity - currentReceived;

      if (qty > maxQty) {
        return NextResponse.json(
          {
            message: `Qty for ${material_ID} exceeds the remaining (${maxQty})`,
          },
          { status: 400 }
        );
      }

      await itemsCollection.updateOne(
        { po_ID, material_ID },
        { $inc: { received_qty: qty } }
      );
    }

    // Cek semua item setelah update
    const allItems = await itemsCollection.find({ po_ID }).toArray();
    const fullyReceived = allItems.every(
      (item) => (item.received_qty || 0) >= item.quantity
    );

    const status = fullyReceived ? "Received" : "Partially Received";

    // Update status & tanggal di purchase_orders
    await poCollection.updateOne(
      { po_ID },
      { $set: { status, received_date: formattedDate } }
    );

    return NextResponse.json({ message: "Receiving updated successfully." });
  } catch (err) {
    console.error("🔥 API Error PUT /api/receiving:", err);
    return NextResponse.json(
      { message: "Gagal memperbarui receiving." },
      { status: 500 }
    );
  }
}
