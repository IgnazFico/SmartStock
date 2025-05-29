// app/api/materials/route.js
import connect from "@/utils/db";

export async function GET() {
  try {
    const db = await connect();
    const materials = await db.collection("material")
      .find({}, { projection: { material_ID: 1, material: 1, _id: 0 } })
      .toArray();

    return new Response(JSON.stringify(materials), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Gagal mengambil data materials:", err);
    return new Response("Gagal mengambil data materials", { status: 500 });
  }
}
