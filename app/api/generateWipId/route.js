import connect from "../../../utils/db";

export async function GET() {
  const db = await connect();

  let nextNumber = 1;
  let newWipId = "";

  // Cari WIP terakhir
  const result = await db
    .collection("inv_wip_production")
    .find({})
    .sort({ _id: -1 })
    .limit(1)
    .toArray();

  if (result.length > 0) {
    const last = result[0].WipID || result[0].wip_ID;
    const match = last && last.match(/^WIP_(\d+)$/);
    if (match) nextNumber = parseInt(match[1], 10) + 1;
  }

  // Pastikan tidak duplikat
  while (true) {
    newWipId = `WIP_${nextNumber}`;
    const check = await db
      .collection("inv_wip_production")
      .findOne({ $or: [{ WipID: newWipId }, { wip_ID: newWipId }] });
    if (!check) break;
    nextNumber++;
  }

  return Response.json({ wipId: newWipId });
}