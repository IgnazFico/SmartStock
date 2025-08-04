// /api/getRoutings/route.js
import { NextResponse } from "next/server";
import connect from "../../../utils/db";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const routingID = searchParams.get("process_id"); // Optional filter

    const db = await connect();
    const query = routingID ? { process_id: routingID } : {};

    // Fetch process headers (filtered if routingID provided)
    const processList = await db.collection("process").find(query).toArray();

    const results = [];
    for (const proc of processList) {
      // Fetch operations linked to this process
      const operations = await db
        .collection("process_operation")
        .find({ process_id: proc.process_id })
        .toArray();

      // For each operation, fetch its components
      const opDetails = [];
      for (const op of operations) {
        // Try to fetch by both process_id and operation_id, fallback to process_id only (legacy data)
        let materials = await db
          .collection("process_material")
          .find({ process_id: proc.process_id, operation_id: op.operation_id })
          .toArray();
        if (!materials.length) {
          materials = await db
            .collection("process_material")
            .find({ process_id: proc.process_id })
            .toArray();
        }

        // Fetch machine_code and description from operation collection using operation_id
        let machine_code = null;
        let description = null;
        const opDoc = await db
          .collection("operation")
          .findOne({ operation_id: op.operation_id });
        if (opDoc) {
          machine_code = opDoc.machine_code || null;
          description = opDoc.description || opDoc.description || null;
        }

        opDetails.push({
          ...op,
          machine_code,
          description,
          components: materials.map((mat) => mat.component_id),
        });
      }

      results.push({
        ...proc,
        operations: opDetails,
      });
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error("Error fetching routings:", error);
    return NextResponse.json(
      { message: "Failed to fetch routings." },
      { status: 500 }
    );
  }
}
