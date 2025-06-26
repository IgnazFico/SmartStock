import connect from "@/utils/db";

export async function GET() {
  const db = await connect();
  const collection = db.collection("production_order");

  // Find the highest ID
  const latest = await collection
    .find({})
    .sort({ prod_order_id: -1 })
    .limit(1)
    .toArray();

  let nextID = "PRD001"; // default
  if (latest.length > 0) {
    const currentNum = parseInt(latest[0].prod_order_id.replace("PRD", ""), 10);
    const newNum = currentNum + 1;
    nextID = `PRD${newNum.toString().padStart(3, "0")}`;
  }

  return new Response(JSON.stringify({ prod_order_id: nextID }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
