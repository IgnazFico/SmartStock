

import { NextResponse } from 'next/server';
import connect from "../../../utils/db";

export async function GET() {
  try {
    const db = await connect();
    const collection = db.collection("inv_raw_material");

    const rawMaterials = await collection
      .find({})
      .project({
        rm_ID: 1,           
        warehouse_ID: 1,
        part_number: 1,
        quantity: 1,
        locator: 1,
        po_ID: 1,
        time_submitted: 1,
      })
      .sort({ time_submitted: -1 }) 
      .toArray();

    return NextResponse.json(rawMaterials, { status: 200 });
  } catch (error) {
    console.error("Error fetching raw material data:", error);
    return NextResponse.json(
      { message: "Failed to fetch raw material records." },
      { status: 500 }
    );
  }
}
