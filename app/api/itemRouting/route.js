import { NextResponse } from "next/server";
import connect from "../../../utils/db";

// Function to auto-generate next operation_ID
async function getOperationID(machineCode) {
  const numeric = parseInt(machineCode.slice(1), 10);
  return "O" + numeric.toString().padStart(4, "0");
}

export async function POST(req) {
  const body = await req.json();
  const { itemID, process_id, process_name, processes } = body;

  const db = await connect();

  try {
    // Check for duplicate process_id
    const existing = await db.collection("process").findOne({ process_id });
    if (existing) {
      return NextResponse.json(
        { message: `Routing '${process_id}' already exists.` },
        { status: 400 }
      );
    }

    // Insert main process record
    await db.collection("process").insertOne({
      process_id,
      item_id: itemID,
      process_name,
    });

    for (const process of processes) {
      const { machineCode, workCenter, description, components } = process;

      // 1. Generate and insert new operation
      const newOperationID = await getOperationID(machineCode);

      // 2. Link to process_operation
      await db.collection("process_operation").insertOne({
        process_id,
        operation_id: newOperationID,
      });

      // 3. Link required components to this process
      if (Array.isArray(components)) {
        for (const component_id of components) {
          if (component_id) {
            await db.collection("process_material").insertOne({
              process_id,
              operation_id: newOperationID,
              component_id,
            });
          }
        }
      }
    }

    return NextResponse.json({ message: "Routing saved successfully!" });
  } catch (error) {
    console.error("Routing save error:", error);
    return NextResponse.json(
      { message: "Error saving routing" },
      { status: 500 }
    );
  }
}
