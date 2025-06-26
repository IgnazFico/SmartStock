import { NextResponse } from "next/server";
import connect from "../../../utils/db";

function getValidTimestamp(input) {
  const date = input ? new Date(input) : new Date();
  return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

export async function POST(req) {
  try {
    const { records } = await req.json();
    const db = await connect();

    // Ambil semua locator kategori raw_material dari master (sekali saja)
    const rmLocators = await db.collection("locator_master")
      .find({ category: "raw_material" })
      .map(l => l.locator)
      .toArray();

    for (let record of records) {
      const {
        id,
        rm_ID,
        warehouse_ID = "wh_rm",
        part_number,
        quantity,
        locator,
        po_ID,
        worker_barcode = "",
      } = record;
      const _id = id;
      const timeSubmitted = getValidTimestamp(record.time_updated);

      let invTimeSubmittedForLog = null;

      // === VALIDASI LOCATOR ===
      if (locator !== "OUT" && !rmLocators.includes(locator)) {
        return NextResponse.json(
          { message: `Locator ${locator} tidak valid untuk kategori raw_material!` },
          { status: 400 }
        );
      }
      // === END VALIDASI ===

      if (locator !== "OUT") {
        // Barang masuk ke rak/locator tertentu
        const existingRM = await db.collection("inv_raw_material").findOne({
          rm_ID,
          warehouse_ID,
          part_number,
          po_ID,
          locator,
        });

        if (existingRM) {
          const newQty = (existingRM.quantity || 0) + quantity;
          await db.collection("inv_raw_material").updateOne(
            { _id: existingRM._id },
            { $set: { quantity: newQty, time_updated: timeSubmitted } }
          );
          invTimeSubmittedForLog = existingRM.time_submitted;
        } else {
           // CEK DUPLIKAT RM_ID DI SELURUH LOCATOR AKTIF
          const duplicate = await db.collection("inv_raw_material").findOne({
            rm_ID,
              });
               if (duplicate) {
                  return NextResponse.json(
                    { message: `Duplicate RM_ID. This material is already in inventory.` },
                    { status: 400 }
                  );
                }
          // Insert new record
          await db.collection("inv_raw_material").insertOne({
            rm_ID,
            warehouse_ID: "wh_rm",
            part_number,
            quantity,
            locator,
            po_ID,
            time_submitted: timeSubmitted,
            time_updated: timeSubmitted,
          });
          invTimeSubmittedForLog = timeSubmitted;
        }
      } else {
        // Barang keluar dari rak/locator kategori raw_material
        let qtyToReduce = quantity;
        const cursor = db.collection("inv_raw_material").find({
          rm_ID,
          warehouse_ID,
          part_number,
          po_ID,
          locator: { $in: rmLocators },
        }).sort({ quantity: -1 });

        while (qtyToReduce > 0 && await cursor.hasNext()) {
          const row = await cursor.next();
          if (!row) break;
          const availableQty = row.quantity || 0;

          if (invTimeSubmittedForLog === null) {
            invTimeSubmittedForLog = row.time_submitted;
          }

          if (availableQty > qtyToReduce) {
            await db.collection("inv_raw_material").updateOne(
              { _id: row._id },
              { $set: { quantity: availableQty - qtyToReduce, time_updated: timeSubmitted } }
            );
            qtyToReduce = 0;
          } else {
            await db.collection("inv_raw_material").deleteOne({ _id: row._id });
            qtyToReduce -= availableQty;
          }
        }
      }

      // Log
      await db.collection("printec_wh_log").insertOne({
        record_id: _id,
        rm_ID,
        warehouse_ID,
        part: part_number,
        qty_updated: quantity,
        loc_updated: locator,
        po_no: po_ID,
        worker_barcode,
        time_updated: timeSubmitted,
        timeSubmitted: invTimeSubmittedForLog,
        action: locator === "OUT" ? "out" : "in",
      });
    }

    return NextResponse.json({ message: "Submit berhasil." }, { status: 200 });

  } catch (error) {
    console.error("Submit record error:", error);
    return NextResponse.json(
      { message: "Gagal submit record.", error: error.message },
      { status: 500 }
    );
  }
}