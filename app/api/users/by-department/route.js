// app/api/users/by-department/route.js
import { NextResponse } from "next/server";
import connect from "@/utils/db";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const department = searchParams.get("department");
  

  try {
    const db = await connect(); // pakai native client dari utils/db.js
    const users = await db
  .collection("user")
  .find(
    { department: { $regex: `^${department}$`, $options: "i" } },
    { projection: { users_ID: 1, name: 1, _id: 0 } }
  )
  .toArray();

      console.log("Department parameter:", department);
      console.log("Hasil users query:", users);


    return NextResponse.json(users);
  } catch (err) {
    console.error("API Error:", err);
    return new NextResponse("Gagal mengambil user berdasarkan department", { status: 500 });
  }
}
