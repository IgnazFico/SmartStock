import { NextResponse } from "next/server";
import connect from "../../../utils/db";

export const GET = async () => {
  try {
    const db = await connect();
    const masterData = await db.collection("master_data").find().toArray();

    return NextResponse.json(masterData);
  } catch (error) {
    console.error("Error fetching master_data:", error);
    return NextResponse.json({ message: "Failed to fetch master_data" }, { status: 500 });
  }
};
