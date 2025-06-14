import { NextResponse } from "next/server";
import connect from "../../../../utils/db";

export async function GET(req, { params }) {
  const { prod_order_id } = params;

  if (!prod_order_id) {
    return NextResponse.json(
      { message: "Missing production order ID" },
      { status: 400 }
    );
  }

  try {
    const db = await connect();

    const order = await db
      .collection("production_order")
      .findOne({ prod_order_id: prod_order_id });

    if (!order) {
      return NextResponse.json(
        { message: "Production order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching production order:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
