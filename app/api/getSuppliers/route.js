export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import connect from "../../../utils/db";

export async function GET(request) {
  try {
    const db = await connect();

    const collection = db.collection("supplier");
    const records = await collection.find({}).toArray();

    const response = NextResponse.json(records, { status: 200 });
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (error) {
    console.error("Error fetching records:", error);

    return NextResponse.json(
      { message: "Failed to fetch records." },
      { status: 500 }
    );
  }
}
