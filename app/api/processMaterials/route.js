import { NextResponse } from "next/server";
import connect from "../../../utils/db";

export async function GET(req) {
  try {
    const db = await connect();

    const url = new URL(req.url);
    const item_id = url.searchParams.get("item_id");

    if (!item_id) {
      return NextResponse.json({ error: "Missing item_id" }, { status: 400 });
    }

    // 1. Get all processes for the item_id
    const processes = await db
      .collection("process")
      .find({ item_id })
      .toArray();

    if (!processes.length) {
      return NextResponse.json({});
    }

    const processIds = processes.map((p) => p.process_ID);

    // 2. Get all process_material mappings
    const materials = await db
      .collection("process_material")
      .find({ process_ID: { $in: processIds } })
      .toArray();

    // 3. Group by process_ID
    const grouped = {};
    for (const mat of materials) {
      const pid = mat.process_ID;
      if (!grouped[pid]) grouped[pid] = [];
      grouped[pid].push({
        material_id: mat.material_ID,
        quantity: mat.quantity,
      });
    }

    return NextResponse.json(grouped);
  } catch (err) {
    console.error("Error in /api/processMaterials:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
