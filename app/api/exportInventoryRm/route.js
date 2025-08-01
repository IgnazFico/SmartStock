import { NextResponse } from "next/server";
import connect from "@/utils/db";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const db = await connect();
    const collection = db.collection("inv_raw_material"); // ganti sesuai nama koleksimu
    const data = await collection.find({}).toArray();

    // Bersihkan _id agar tidak error di Excel
    const cleanedData = data.map(({ _id, ...rest }) => ({
      ...rest,
      id: _id.toString(), // jika kamu ingin tetap menyimpan _id
    }));

    return NextResponse.json(cleanedData, { status: 200 });
  } catch (err) {
    console.error("🔥 Error GET /exportInventory:", err);
    return NextResponse.json({ message: "Gagal mengambil data" }, { status: 500 });
  }
}
