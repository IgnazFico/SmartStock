import connect from "../../../utils/db";

export async function GET() {
  const db = await connect();

  let nextNumber = 1;
  let newRmId = "";

  // Cari kode terakhir yang sesuai pola
  const result = await db
    .collection("inv_raw_material")
    .find({ rm_ID: { $regex: /^INV_\d+RM$/ } })
    .sort({ _id: -1 })
    .limit(1)
    .toArray();

  if (result.length > 0) {
    const last = result[0].rm_ID;
    const match = last && last.match(/^INV_(\d+)RM$/);
    if (match) nextNumber = parseInt(match[1], 10) + 1;
  }

  // Pastikan tidak duplikat
  while (true) {
    newRmId = `INV_${nextNumber}RM`;
    const check = await db
      .collection("inv_raw_material")
      .findOne({ rm_ID: newRmId });
    if (!check) break;
    nextNumber++;
  }

  return Response.json({ rmId: newRmId });
}