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

    // Ambil semua locator kategori production dari master (sekali saja)
    const productionLocators = await db.collection("locator_master")
      .find({ category: "production" })
      .map(l => l.locator)
      .toArray();

    for (let record of records) {
      const {
        id,
        locator,
        qty,
        part_number,
        prod_order_id,
        warehouse_ID = "wh_wip",
        wip_ID 
      } = record;
      const _id = id;
      const timeSubmitted = getValidTimestamp(record.time_updated);

      let invTimeSubmittedForLog = null;

      // Hanya izinkan locator kategori production
      if (locator !== "OUT" && !productionLocators.includes(locator)) {
        return NextResponse.json(
          { message: `Locator ${locator} tidak valid untuk kategori production!` },
          { status: 400 }
        );
      }
      // === END VALIDASI ===

      if (locator !== "OUT") {
        // Barang masuk ke rak/locator tertentu
        const existingProduction = await db.collection("inv_wip_production").findOne({
          wip_ID,
          prod_order_id,
          locator,
        });

        if (existingProduction) {
          const newQty = (existingProduction.quantity || 0) + qty;
          await db.collection("inv_wip_production").updateOne(
            { _id: existingProduction._id },
            { $set: { quantity: newQty, time_updated: timeSubmitted } }
          );
          invTimeSubmittedForLog = existingProduction.time_submitted;
        } else {
          // Insert baru
          await db.collection("inv_wip_production").insertOne({
            wip_ID,
            prod_order_id,
            part_number,
            quantity: qty,
            warehouse_id: "wh_wip",
            locator,
            time_submitted: timeSubmitted,
            time_updated: timeSubmitted,
          });
          invTimeSubmittedForLog = timeSubmitted;
        }
      } else {
        // Barang keluar dari rak/locator tertentu
        const existingProduction = await db.collection("inv_wip_production").findOne({
          wip_ID,
          prod_order_id,
          locator: { $in: productionLocators },
        });

        if (existingProduction) {
          invTimeSubmittedForLog = existingProduction.time_submitted;

          const newQty = (existingProduction.quantity || 0) - qty;
          if (newQty > 0) {
            await db.collection("inv_wip_production").updateOne(
              { _id: existingProduction._id },
              { $set: { quantity: newQty, time_updated: timeSubmitted } }
            );
          } else {
            await db.collection("inv_wip_production").deleteOne({ _id: existingProduction._id });
          }
        }
      }

      // Log
      await db.collection("printec_wh_log").insertOne({
        record_id: _id,
        wip_ID,
        po_no: prod_order_id,
        part: part_number,
        qty_updated: qty,
        loc_updated: locator,
        warehouse_id: "wh_wip",
        time_updated: timeSubmitted,
        timeSubmitted: invTimeSubmittedForLog,
        action: locator === "OUT" ? "out" : "in",
      });
    } 

    return NextResponse.json({ message: "Success submit record." }, { status: 200 });

  } catch (error) {
    console.error("Submit record error:", error);
    return NextResponse.json(
      { message: "Gagal submit record.", error: error.message },
      { status: 500 }
    );
  }
}