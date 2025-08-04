import { NextResponse } from "next/server";
import connect from "../../../utils/db";

export async function POST(req) {
  try {
    const { machine_code, work_center, description, operation_id } = await req.json();
    if (!machine_code || !work_center || !description || !operation_id) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }
    const db = await connect();
    // Prevent duplicate operation_id
    const exists = await db.collection("operation").findOne({ operation_id });
    if (exists) {
      return NextResponse.json({ message: "Operation ID already exists" }, { status: 400 });
    }
    const doc = {
      operation_id,
      machine_code,
      work_center,
      description,
    };
    await db.collection("operation").insertOne(doc);
    return NextResponse.json(doc);
  } catch (error) {
    console.error("Error inserting operation:", error);
    return NextResponse.json({ message: "Error inserting operation" }, { status: 500 });
  }
}
