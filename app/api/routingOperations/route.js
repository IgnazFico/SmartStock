import connect from "../../../utils/db";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const process_id = searchParams.get("process_id");

  if (!process_id) {
    return new Response(JSON.stringify([]), { status: 400 });
  }

  const db = await connect();

  // Join process_operation and operation table based on operation_ID
  const pipeline = [
    { $match: { process_id: process_id } },
    {
      $lookup: {
        from: "operation",
        localField: "operation_id",
        foreignField: "operation_id",
        as: "operationDetails",
      },
    },
    { $unwind: "$operationDetails" },
    {
      $project: {
        operation: "$operation_id",
        nextOperation: "",
        status: "Planned",
        workCenter: "$operationDetails.work_center",
        machine: "$operationDetails.machine_code",
        description: "$operationDetails.description",
      },
    },
  ];

  const result = await db
    .collection("process_operation")
    .aggregate(pipeline)
    .toArray();

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
