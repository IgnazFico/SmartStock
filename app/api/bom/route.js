import { NextResponse } from "next/server";
import connect from "../../../utils/db";

async function insertBOM(db, parent, components, itemIds = null) {
  // Get all item_master ids once for the whole BOM tree
  if (!itemIds) {
    const items = await db.collection("item_master").find({}, { projection: { item_id: 1 } }).toArray();
    itemIds = new Set(items.map(i => i.item_id));
  }
  for (const comp of components) {
    const { item, quantity, unit, subcomponents } = comp;
    // is_wip: true if this component is from item_master, false if from material
    const isWip = itemIds.has(item);
    await db.collection("bom").insertOne({
      parent_item_id: parent,
      component_item_id: item,
      quantity: Number(quantity),
      unit: unit,
      is_wip: isWip,
    });
    if (subcomponents?.length) {
      await insertBOM(db, item, subcomponents, itemIds);
    }
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { mainItem, components } = body;

    const db = await connect();

    await insertBOM(db, mainItem, components);

    return NextResponse.json({ message: "BOM saved successfully" });
  } catch (err) {
    console.error("Failed to save BOM:", err);
    return NextResponse.json({ message: "Error saving BOM" }, { status: 500 });
  }
}
