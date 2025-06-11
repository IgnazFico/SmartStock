import { NextResponse } from "next/server";
import connect from "../../../../utils/db";

export async function POST(req) {
  try {
    const poArray = await req.json();

    if (!Array.isArray(poArray) || poArray.length === 0) {
      return NextResponse.json(
        { error: "Request body harus berupa array PO yang tidak kosong" },
        { status: 400 }
      );
    }

    const db = await connect();
    const poCollection = db.collection("purchase_orders");
    const poItemCollection = db.collection("purchase_orders_items");

    // Ambil last po_ID dari DB untuk generate ID baru
    const lastPO = await poCollection.find().sort({ po_ID: -1 }).limit(1).toArray();
    let lastPoNumber = 0;
    if (lastPO.length > 0) {
      lastPoNumber = parseInt(lastPO[0].po_ID.slice(2));
    }

    // Ambil last order_items_ID untuk generate unik
    const lastItem = await poItemCollection.find().sort({ order_items_ID: -1 }).limit(1).toArray();
    let lastItemNumber = 0;
    if (lastItem.length > 0) {
      // Misal format OI0001, ambil angka setelah 'OI'
      lastItemNumber = parseInt(lastItem[0].order_items_ID.slice(2));
    }

    const posToInsert = [];
    const poItemsToInsert = [];

    for (const po of poArray) {
      // Validasi PO utama
      if (
        !po.supplier_ID || typeof po.supplier_ID !== "string" ||
        !po.order_date || isNaN(Date.parse(po.order_date)) ||
        !Array.isArray(po.items) || po.items.length === 0
      ) {
        return NextResponse.json(
          { error: "Data PO tidak lengkap atau salah format" },
          { status: 400 }
        );
      }

      // Validasi tiap item
      for (const item of po.items) {
        if (
          !item.material_ID || typeof item.material_ID !== "string" ||
          typeof item.quantity !== "number" || item.quantity < 1
        ) {
          return NextResponse.json(
            { error: "Data item PO tidak lengkap atau salah format" },
            { status: 400 }
          );
        }
      }

      // Generate po_ID baru
      lastPoNumber++;
      const newPoID = `PO${lastPoNumber.toString().padStart(4, "0")}`;

      // Header PO
      posToInsert.push({
        po_ID: newPoID,
        order_date: new Date(po.order_date),
        supplier_ID: po.supplier_ID,
        status: po.status || "pending",
        received_date: po.received_date ? new Date(po.received_date) : null,
      });

      // Detail Items dengan order_items_ID unik
      for (const item of po.items) {
        lastItemNumber++;
        const newOrderItemID = `OI${lastItemNumber.toString().padStart(4, "0")}`;

        poItemsToInsert.push({
          order_items_ID: newOrderItemID,
          po_ID: newPoID,
          material_ID: item.material_ID,
          quantity: item.quantity,
        });
      }
    }

    // Insert data PO dan items
    const insertPOResult = await poCollection.insertMany(posToInsert);
    const insertItemResult = await poItemCollection.insertMany(poItemsToInsert);

    return NextResponse.json(
      {
        message: `Berhasil insert ${insertPOResult.insertedCount} PO dan ${insertItemResult.insertedCount} item.`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("🔥 Error inserting bulk PO:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan PO secara bulk" },
      { status: 500 }
    );
  }
}
