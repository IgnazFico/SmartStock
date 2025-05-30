import connect from "@/utils/db";

export async function GET() {
  try {
    const db = await connect();
    const departments = await db.collection("user").distinct("department");
    return new Response(JSON.stringify(departments), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response("Gagal mengambil data department", { status: 500 });
  }
}
