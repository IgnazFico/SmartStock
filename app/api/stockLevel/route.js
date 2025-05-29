import connect from "@/utils/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const db = await connect();
    const data = await db
      .collection("rm_inventory")
      .find({})
      .sort({ quantity: 1 }) // ascending = lowest first
      .limit(5)
      .toArray();

    const result = data.map((item) => ({
      part_number: item.part_number,
      quantity: item.quantity,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching rm_inventory:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
