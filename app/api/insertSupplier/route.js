import { NextResponse } from "next/server";
import connect from "../../../utils/db";

export async function POST(req) {
  try {
    const { supplier_ID, supplier, phone, address } = await req.json();
    if (!supplier_ID || !supplier) {
      return NextResponse.json({ message: "supplier_ID and supplier are required" }, { status: 400 });
    }
    const db = await connect();
    // Prevent duplicate supplier_ID
    const exists = await db.collection("supplier").findOne({ supplier_ID });
    if (exists) {
      return NextResponse.json({ message: "Supplier ID already exists" }, { status: 400 });
    }
    const doc = {
      supplier_ID,
      supplier,
      phone: phone || "",
      address: address || "",
    };
    await db.collection("supplier").insertOne(doc);
    return NextResponse.json(doc);
  } catch (error) {
    console.error("Error inserting supplier:", error);
    return NextResponse.json({ message: "Error inserting supplier" }, { status: 500 });
  }
}
