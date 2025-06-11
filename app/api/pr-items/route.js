// /app/api/pr-items/route.js
import { NextResponse } from "next/server";
import connect from "../../../utils/db";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const pr_ID = searchParams.get("pr_ID");

  if (!pr_ID) {
    return NextResponse.json({ message: "pr_ID wajib disertakan di query" }, { status: 400 });
  }

  try {
    const db = await connect();
    const items = await db
      .collection("purchase_requests_items")
      .find({ pr_ID })
      .toArray();

    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    console.error("🔥 Gagal mengambil item PR:", error);
    return NextResponse.json({ message: "Gagal ambil data item PR" }, { status: 500 });
  }
}
