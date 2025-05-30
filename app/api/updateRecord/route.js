import { NextResponse } from "next/server";
import connect from "../../../utils/db"; // Ensure your db utility is correctly set up

export async function POST(req) {
  try {
    const { id, qtyToThrow } = await req.json();
    const db = await connect();

    const recordId = id;

    function formatTimestamp() {
      const date = new Date();
      return date.toISOString(); // Returns timestamp in ISO 8601 format
    }

    // Fetch the existing record from printec_wh
    const existingRecord = await db
      .collection("inv_finish_good")
      .findOne({ _id: recordId });

    if (!existingRecord) {
      return NextResponse.json(
        { message: "Record not found." },
        { status: 404 }
      );
    }

    // Extract po_no, part, and timeSubmitted from the existing record
    const { po_no, part, timeSubmitted, qty } = existingRecord;

    // Update the quantity in printec_wh
    const newQty = qty - qtyToThrow;
    if (newQty < 0) {
      return NextResponse.json(
        { message: "Insufficient quantity to throw." },
        { status: 400 }
      );
    }

    await db
      .collection("inv_finish_good")
      .updateOne({ _id: recordId }, { $set: { qty: newQty } });

    // Log the throw operation in printec_wh_log
    await db.collection("wh_log").insertOne({
      record_id: recordId,
      qty_updated: qtyToThrow, // The quantity that was thrown
      time_updated: formatTimestamp(), // Time of the throw
      loc_updated: "THROW", // Set to "throw" since it's a throw action
      action: "throw",
      po_no,
      part,
      timeSubmitted,
    });

    return NextResponse.json(
      { message: "Record updated successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update record error:", error);
    return NextResponse.json(
      { message: "Failed to update record.", error: error.message },
      { status: 500 }
    );
  }
}
