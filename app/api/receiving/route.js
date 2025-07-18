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
        {
          message:
            "Unauthorized. Only logistics department can update receiving status.",
        },
        { status: 403 }
      );
    }

    const { po_ID, received_date, status } = await request.json();

    if (!po_ID) {
      return NextResponse.json(
        { message: "po_ID wajib diisi" },
        { status: 400 }
      );
    }

    const db = await connect();
    const collection = db.collection("purchase_orders");

    const result = await collection.updateOne(
      { po_ID },
      { $set: { received_date, status } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { message: "Tidak ada data yang diperbarui." },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Data berhasil diperbarui." });
  } catch (err) {
    console.error("🔥 API Error PUT /api/receiving:", err);
    return NextResponse.json(
      { message: "Gagal memperbarui data." },
      { status: 500 }
    );
  }
}
