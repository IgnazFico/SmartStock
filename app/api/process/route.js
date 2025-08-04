export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import connect from "../../../utils/db";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const process_id = searchParams.get("process_id");

    if (!process_id) {
      return NextResponse.json(
        { message: "Missing process_id" },
        { status: 400 }
      );
    }

    const db = await connect();

    const processes = await db
      .collection("process")
      .find({ process_id })
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
