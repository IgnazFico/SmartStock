// /app/api/pr-items/route.js
import { NextResponse } from "next/server";
import connect from "../../../utils/db";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const pr_ID = searchParams.get("pr_ID");

  try {
    const db = await connect();

    if (pr_ID) {
      // Kalau ada pr_ID → return item untuk PR tertentu
      const items = await db
        .collection("purchase_requests_items")
        .find({ pr_ID })
        .toArray();
      return NextResponse.json(items, { status: 200 });
    }

    // Kalau tidak ada pr_ID → return semua items
    const allItems = await db
      .collection("purchase_requests_items")
      .find()
      .toArray();
    return NextResponse.json(allItems, { status: 200 });
  } catch (error) {
    console.error("🔥 Gagal mengambil item PR:", error);
    return NextResponse.json(
      { message: "Gagal ambil data item PR" },
      { status: 500 }
    );
  }
}
