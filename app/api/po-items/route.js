import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import connect from "../../../utils/db";

// GET - ambil semua PO Items atau berdasarkan po_ID
export async function GET(req) {
  try {
    const db = await connect();
    const collection = db.collection("purchase_orders_items");

    const { searchParams } = new URL(req.url);
    const po_ID = searchParams.get("po_ID");

    const query = po_ID ? { po_ID } : {};

    const items = await collection.find(query).toArray();

    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    console.error("Error fetching PO Items:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data PO Items" },
      { status: 500 }
    );
  }
}

// POST - insert 1 atau banyak PO Items, dengan auto generate order_items_ID
export async function POST(req) {
  try {
    const body = await req.json();

    // support single object atau array
    const itemsArray = Array.isArray(body) ? body : [body];

    // validasi tiap item
    for (const item of itemsArray) {
      if (
        !item.po_ID ||
        typeof item.po_ID !== "string" ||
        !item.material_ID ||
        typeof item.material_ID !== "string" ||
        typeof item.quantity !== "number" ||
        item.quantity < 1
      ) {
        return NextResponse.json(
          { error: "PO Item data is incomplete or incorrectly formatted" },
          { status: 400 }
        );
      }
    }

    // tambahkan order_items_ID unik & field received_qty default 0
    const itemsToInsert = itemsArray.map((item) => ({
      ...item,
      order_items_ID: uuidv4(),
      received_qty: 0,
    }));

    const db = await connect();
    const collection = db.collection("purchase_orders_items");

    const result = await collection.insertMany(itemsToInsert);

    return NextResponse.json(
      { message: `Succes insert ${result.insertedCount} PO Items.` },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error inserting PO Items:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan PO Items" },
      { status: 500 }
    );
  }
}
