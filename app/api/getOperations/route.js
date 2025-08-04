import connect from "@/utils/db";
import { NextResponse } from "next/server";

export async function GET() {
  const db = await connect();
  const operations = await db.collection("operation").find({}).toArray();
  return NextResponse.json(operations);
}
