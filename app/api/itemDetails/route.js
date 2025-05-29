import connect from "../../../utils/db";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const item_id = searchParams.get("item_id");

  if (!item_id) {
    return NextResponse.json({ error: "Missing item_id" }, { status: 400 });
  }

  try {
    const db = await connect();

    // Step 1: Find item description
    const item = await db.collection("item_master").findOne({ item_id });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Step 2: Find the associated process (if any)
    const process = await db.collection("process").findOne({ item_id });

    return NextResponse.json({
      description: item.description,
      process_id: process?.process_ID || null,
    });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
