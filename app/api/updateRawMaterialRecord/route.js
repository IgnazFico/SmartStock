import { NextResponse } from "next/server";
import connect from "../../../utils/db";

// 🔧 Helper buat angka random
function generateRandomNumber(length = 5) {
  return Math.floor(Math.random() * Math.pow(10, length)).toString().padStart(length, "0");
}

// 🔁 Helper buat generate ID unik di MongoDB
async function generateUniqueID(collection, field, prefix, suffix = "") {
  const db = await connect();
  let id;
  let exists = true;

  while (exists) {
    const random = generateRandomNumber();
    id = `${prefix}${random}${suffix}`;
    const existing = await db.collection(collection).findOne({ [field]: id });
    if (!existing) exists = false;
  }

  return id;
}

export async function POST(req) {
  try {
    const body = await req.json();

    const db = await connect();
    const collection = db.collection("inv_raw_material");

    const {
      part_number,
      quantity,
      locator,
      po_ID,
      time_submitted = new Date().toISOString()
    } = body;

    // ✅ Validasi basic
    if (!part_number || !quantity || !locator || !po_ID) {
      return NextResponse.json(
        { message: "Missing required fields." },
        { status: 400 }
      );
    }

    // 🔄 Generate id baru meskipun id dikirim dari frontend
    const rm_ID = await generateUniqueID("inv_raw_material", "rm_ID", "INV_", "RM");
    const warehouse_ID = await generateUniqueID("inv_raw_material", "warehouse_ID", "WH-");
    

    // 💾 Simpan ke database
    await collection.insertOne({
      rm_ID,
      warehouse_ID,
      part_number,
      quantity,
      locator,
      po_ID,
      time_submitted,
    });

    return NextResponse.json(
      {
        message: "Raw Material inserted successfully.",
        rm_ID,
        warehouse_ID
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Insert raw material error:", error);
    return NextResponse.json(
      { message: "Failed to insert raw material.", error: error.message },
      { status: 500 }
    );
  }
}
