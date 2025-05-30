import { NextResponse } from "next/server";
import connect from "../../../utils/db";

export const GET = async () => {
  try {
    const db = await connect();
    const wipData = await db.collection("inv_wip_production").find().toArray();
    return NextResponse.json(wipData);
  } catch (error) {
    console.error("Error fetching wip_inventory:", error);
    return NextResponse.json({ message: "Failed to fetch wip_inventory" }, { status: 500 });
  }
};
