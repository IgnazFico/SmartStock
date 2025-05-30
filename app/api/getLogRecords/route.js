export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import connect from "../../../utils/db";

export async function GET(req) {
  try {
    const db = await connect();

    // Ambil data dari koleksi wh_log
    const whLogs = await db
      .collection("wh_log")
      .aggregate([
        {
          $group: {
            _id: "$record_id",
            logs: { $push: "$$ROOT" },
          },
        },
      ])
      .toArray();

    const whLogDetails = whLogs.flatMap((group) => group.logs);

    // Ambil data dari koleksi printec_wh_log
    const printecLogs = await db.collection("printec_wh_log").find({}).toArray();

    // Gabungkan kedua data
    const allLogs = [...whLogDetails, ...printecLogs];

    return NextResponse.json(allLogs, { status: 200 });
  } catch (error) {
    console.error("Error fetching logs:", error);
    return NextResponse.json(
      { message: "Failed to fetch logs." },
      { status: 500 }
    );
  }
}
