import connect from "@/utils/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    const db = await connect();

    // Step 1: Fetch 5 lowest raw material stocks
    const inventory = await db
      .collection("inv_raw_material")
      .find({})
      .sort({ quantity: 1 })
      .limit(5)
      .toArray();

    // Step 2: Extract all part_numbers
    const partNumbers = inventory.map((item) => item.part_number);

    // Step 3: Fetch corresponding materials with thresholds
    const materials = await db
      .collection("material")
      .find({ material_ID: { $in: partNumbers } })
      .toArray();

    // Step 4: Create a map of part_number to threshold
    const thresholdMap = {};
    materials.forEach((mat) => {
      thresholdMap[mat.material_ID] = mat.threshold ?? 0; // fallback to 0 if threshold not set
    });

    // Step 5: Combine inventory with thresholds
    const result = inventory.map((item) => ({
      part_number: item.part_number,
      quantity: item.quantity,
      threshold: thresholdMap[item.part_number] ?? 0,
    }));

    const response = NextResponse.json(result);
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  } catch (error) {
    console.error("Error fetching stock level:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
