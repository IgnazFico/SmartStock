import connect from "@/utils/db";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const item_id = searchParams.get("item_id");

  if (!item_id) {
    return NextResponse.json({ message: "Missing item_id" }, { status: 400 });
  }

  try {
    const db = await connect();

    // Fetch BOM components for the given item
    const bomItems = await db
      .collection("bom")
      .find({ parent_item_id: item_id })
      .toArray();

    const result = [];

    for (const bom of bomItems) {
      const component_id = bom.component_item_id;
      const required_qty = bom.quantity;
      const unit = bom.unit;

      // Optional: fetch material description
      const materialInfo = await db
        .collection("material")
        .findOne({ material_ID: component_id });

      // Helper to sum quantity from a collection
      const sumInventory = async (collection, field = "part_number") => {
        const matchField = field === "part_number" ? "part_number" : "item_id";
        const pipeline = [
          { $match: { [matchField]: component_id } },
          { $group: { _id: null, totalQty: { $sum: "$quantity" } } },
        ];
        const res = await db
          .collection(collection)
          .aggregate(pipeline)
          .toArray();
        return res[0]?.totalQty || 0;
      };

      const qtyInventory = await sumInventory(
        "inv_wip_production",
        "part_number"
      );
      const qtyRM = await sumInventory("inv_raw_material", "part_number");

      result.push({
        material_used: component_id,
        required_qty,
        unit,
        available_qty: qtyInventory + qtyRM,
        sources: {
          inv_wip_production: qtyInventory,
          inv_raw_material: qtyRM,
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in materialEstimate API:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
