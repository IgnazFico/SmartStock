import { NextResponse } from "next/server";
import connect from "@/utils/db";
import * as XLSX from "xlsx";

export async function GET() {
  try {
    const db = await connect();
    const logCollection = db.collection("printec_wh_log"); // Ganti dengan nama koleksimu

    const logs = await logCollection.find({}).toArray();

    const worksheet = XLSX.utils.json_to_sheet(transformed);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Logs");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": "attachment; filename=log_data.xlsx",
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("❌ Export Error:", error);
    return NextResponse.json({ error: "Failed to export logs" }, { status: 500 });
  }
}
