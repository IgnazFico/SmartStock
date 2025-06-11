import connect from "../../../utils/db";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const prod_order_id = searchParams.get("prod_order_id");

  if (!prod_order_id) {
    return NextResponse.json(
      { message: "Missing prod_order_id" },
      { status: 400 }
    );
  }

  try {
    const db = await connect();
    const materials = await db
      .collection("production_material_tracking")
      .find({ prod_order_id })
      .toArray();

    return NextResponse.json(materials);
  } catch (err) {
    console.error("Error fetching used materials:", err);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
