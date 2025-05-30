import connect from "../../../utils/db";

export async function GET() {
  try {
    const db = await connect();

    let nextNumber = 1;
    let newInventoryId = "";

    // Cari Inventory_ID terakhir yang sudah pakai format FG_x
    const result = await db
      .collection("inv_finish_good")
      .find({ Inventory_ID: { $regex: "^FG_" } })
      .sort({ _id: -1 })
      .limit(1)
      .toArray();

    if (result.length > 0) {
      const last = result[0].Inventory_ID;
      const match = last && String(last).match(/^FG_(\d+)$/);
      if (match) nextNumber = parseInt(match[1], 10) + 1;
    }

    // Pastikan tidak duplikat
    while (true) {
      newInventoryId = `FG_${nextNumber}`;
      const check = await db
        .collection("inv_finish_good")
        .findOne({ Inventory_ID: newInventoryId });
      if (!check) break;
      nextNumber++;
    }

    return Response.json({ inventoryId: newInventoryId });
  } catch (err) {
    console.error("API Error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}