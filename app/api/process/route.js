import { NextResponse } from "next/server";
import connect from "../../../utils/db"; // Make sure this is your MongoDB connection

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const item_id = searchParams.get("item_id");

    if (!item_id) {
      return NextResponse.json({ message: "Missing item_id" }, { status: 400 });
    }

    const db = await connect();

    const processes = await db
      .collection("process")
      .find({ item_id })
      .toArray();

    return NextResponse.json(processes);
  } catch (err) {
    console.error("Error fetching process steps:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
