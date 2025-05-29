import { NextResponse } from "next/server";
import connect from "../../../utils/db";

export async function GET() {
  try {
    const db = await connect();
    const supplier = await db.collection("supplier").find({}, { projection: { supplier_ID: 1, supplier: 1 } }).toArray();
    return NextResponse.json(supplier);
  } catch (err) {
    return NextResponse.json({ message: "Gagal mengambil data supplier" }, { status: 500 });
  }
}
