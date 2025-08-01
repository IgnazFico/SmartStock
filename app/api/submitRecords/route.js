import { NextResponse } from "next/server";
import connect from "../../../utils/db";

function getValidTimestamp(input) {
  const date = input ? new Date(input) : new Date();
  return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

export async function POST(req) {
  try {
    // Ambil dan validasi payload
    const body = await req.json();
    const records = body.records;
    if (!Array.isArray(records)) {
      return NextResponse.json(
        { message: "Payload harus berupa { records: [...] }" },
        { status: 400 }
      );
    }

    const db = await connect();

    // Ambil semua locator kategori finish_good dari master (sekali saja)
    const fgLocators = await db.collection("locator_master")
      .find({ category: "finish_good" })
      .map(l => l.locator)
      .toArray();

    for (let record of records) {
      const {
        id,
        Inventory_ID,
        warehouse_Id = "wh_fg",
        part_number,
        quantity,
        locator,
        worker_barcode = "",
      } = record;
      const _id = id;
      const timeSubmitted = getValidTimestamp(record.time_updated);

      let invTimeSubmittedForLog = null;
      let finishGoodId = null;

      // === VALIDASI LOCATOR ===
      console.log("Locator dari user:", locator);
      console.log("Daftar locator valid:", fgLocators);
      if (
        locator !== "OUT" &&
        !fgLocators.map(l => l.toLowerCase().trim()).includes(locator.toLowerCase().trim())
      ) {
        return NextResponse.json(
          { message: `Locator ${locator} tidak valid untuk kategori finish_good!` },
          { status: 400 }
        );
      }
      // === END VALIDASI ===

      if (locator !== "OUT") {
        // Barang masuk ke rak/locator tertentu
        const existingFG = await db.collection("inv_finish_good").findOne({
          Inventory_ID,
          warehouse_Id,
          part_number,
          locator,
        });

        if (existingFG) {
          const newQty = (existingFG.quantity || 0) + quantity;
          await db.collection("inv_finish_good").updateOne(
            { _id: existingFG._id },
            { $set: { quantity: newQty, time_updated: timeSubmitted } }
          );
          finishGoodId = existingFG._id; // <-- Ambil _id dari data yang sudah ada
          invTimeSubmittedForLog = existingFG.time_submitted;
        } else {

           const duplicate = await db.collection("inv_finish_good").findOne({
                Inventory_ID,
              });
              if (duplicate) {
                return NextResponse.json(
                  { message: `Duplicate Inventory ID. This ID is already in inventory.` },
                  { status: 400 }
                );
              }

          // Insert new record
          const insertResult = await db.collection("inv_finish_good").insertOne({
            Inventory_ID,
            warehouse_Id: "wh_fg",
            part_number,
            quantity,
            locator,
            time_submitted: timeSubmitted,
            time_updated: timeSubmitted,
          });
          finishGoodId = insertResult.insertedId; // <-- Ambil _id dari hasil insert
          invTimeSubmittedForLog = timeSubmitted;
        }
      } else {
        // Barang keluar dari rak/locator kategori finish_good
        let qtyToReduce = quantity;
        const cursor = db.collection("inv_finish_good").find({
          Inventory_ID,
          warehouse_Id,
          part_number,
          locator: { $in: fgLocators },
        }).sort({ quantity: -1 });

        while (qtyToReduce > 0 && await cursor.hasNext()) {
          const row = await cursor.next();
          if (!row) break;
          const availableQty = row.quantity || 0;

          if (invTimeSubmittedForLog === null) {
            invTimeSubmittedForLog = row.time_submitted;
          }

          if (availableQty > qtyToReduce) {
            await db.collection("inv_finish_good").updateOne(
              { _id: row._id },
              { $set: { quantity: availableQty - qtyToReduce, time_updated: timeSubmitted } }
            );
            qtyToReduce = 0;
            finishGoodId = row._id; // <-- Ambil _id dari row yang diupdate
          } else {
            await db.collection("inv_finish_good").deleteOne({ _id: row._id });
            qtyToReduce -= availableQty;
            finishGoodId = row._id; // <-- Ambil _id dari row yang dihapus
          }
        }
      }

      // Log
      await db.collection("printec_wh_log").insertOne({
        finish_good_id: finishGoodId, // <-- Simpan _id dari inv_finish_good
        record_id: _id,
        Inventory_ID,
        warehouse_Id,
        part: part_number,
        qty_updated: quantity,
        loc_updated: locator,
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