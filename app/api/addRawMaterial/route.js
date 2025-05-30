import { NextResponse } from "next/server";
import connect from "../../../utils/db";

export async function POST(req) {
  const body = await req.json();
  const db = await connect();
  const collection = db.collection("inv_raw_material");

  const time_submitted = new Date();

  const newRecord = {
    ...body,
    quantity: parseInt(body.quantity),
    time_submitted,
  };

  await collection.insertOne(newRecord);
  return NextResponse.json(newRecord, { status: 201 });
}
