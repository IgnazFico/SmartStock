import { NextResponse } from "next/server";
import connect from "@/utils/db";

export async function GET() {
  try {
    const db = await connect();
    const collection = db.collection("inv_wip_production");

    const data = await collection.find({}).toArray();

    // Format untuk frontend (hilangkan _id)
    const formatted = data.map(({ _id, ...rest }) => rest);

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("❌ Error in exportWIPInventory API:", error);
    return NextResponse.json({ message: "Failed to export WIP inventory" }, { status: 500 });
  }
}
