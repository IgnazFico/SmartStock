import { NextResponse } from "next/server";
import connect from "../../../utils/db";

async function insertBOM(db, parent, components) {
  for (const comp of components) {
    const { item, quantity, unit, subcomponents } = comp;

    await db.collection("bom").insertOne({
      parent_item_id: parent,
      component_item_id: item,
      quantity: Number(quantity),
      unit: unit,
      is_wip: Array.isArray(subcomponents) && subcomponents.length > 0,
    });

    if (subcomponents?.length) {
      await insertBOM(db, item, subcomponents);
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
