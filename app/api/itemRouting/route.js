import { NextResponse } from "next/server";
import connect from "../../../utils/db";

// Function to auto-generate next operation_ID
async function getOperationID(machineCode) {
  const numeric = parseInt(machineCode.slice(1), 10);
  return "O" + numeric.toString().padStart(4, "0");
}

export async function POST(req) {
  const body = await req.json();
  const { itemID, process_id, process_name, wip_code, processes } = body;

  const db = await connect();

  try {
    // Insert main process record
    await db.collection("process").insertOne({
      process_ID: process_id,
      item_id: itemID,
      process_name,
      wip_code,
    });

    for (const process of processes) {
      const { machineCode, workCenter, description, materials } = process;

      // 1. Generate and insert new operation
      const newOperationID = await getOperationID(machineCode);

      // 2. Link to process_operation
      await db.collection("process_operation").insertOne({
        process_ID: process_id,
        operation_ID: newOperationID,
      });

      // 3. Link required materials to this process
      for (const mat of materials) {
        await db.collection("process_material").insertOne({
          process_ID: process_id,
          material_ID: mat.materialID,
          quantity: Number(mat.quantity),
        });
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
