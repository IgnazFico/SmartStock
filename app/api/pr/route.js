import { NextResponse } from "next/server";
import connect from "../../../utils/db";

export async function GET() {
  try {
    const db = await connect();
    const collection = db.collection("purchase_requests");
    const records = await collection.find({}).toArray();

    const formatted = records.map((item) => ({
      pr_ID: item.pr_ID,
      users_ID: item.users_ID,
      department: item.department,
      request_date: item.request_date ? new Date(item.request_date).toISOString().split("T")[0] : "",
      priority: item.priority,
      material_ID: item.material_ID,
      quantity: Number(item.quantity),
      status: item.status,
      remarks: item.remarks ||"",
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("🔥 API Error GET /api/pr:", err);
    return NextResponse.json({ message: "Gagal mengambil data purchase request" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const db = await connect();
    const collection = db.collection("purchase_requests");
    const approvalCollection = db.collection("approval");
    const newPR = await req.json();

    if (!newPR.request_date || !newPR.department) {
      return NextResponse.json({ message: "Request date dan department wajib diisi" }, { status: 400 });
    }

    const allPRs = await collection.find({}).toArray();
    const lastNumber = allPRs
      .map((doc) => parseInt(doc.pr_ID?.slice(2) || "0"))
      .filter((num) => !isNaN(num))
      .sort((a, b) => b - a)[0] || 0;

    const nextPRNumber = lastNumber + 1;
    const pr_ID = `PR${String(nextPRNumber).padStart(5, "0")}`;

    const user = await db.collection("users").findOne({ department: newPR.department });

    const recordToInsert = {
      pr_ID,
      users_ID: newPR.users_ID || "",
      department: newPR.department,
      request_date: new Date(newPR.request_date),
      material_ID: newPR.material_ID,
      quantity: Number(newPR.quantity),
      priority: newPR.priority || "medium",
      status: "pending",
    };

    const result = await collection.insertOne(recordToInsert);
    if (!result.acknowledged) throw new Error("Gagal menyimpan data PR");

    const approvalRecord = {
      approval_ID: `APR-${Date.now()}`,
      pr_ID,
      users_ID: newPR.users_ID || "",
      approval_status: "Pending",
      approval_date: new Date().toISOString(),
      remarks: "",
    };

    await approvalCollection.insertOne(approvalRecord);

    return NextResponse.json({ ...recordToInsert, _id: result.insertedId }, { status: 201 });
  } catch (err) {
    console.error("🔥 API Error POST /api/pr:", err);
    return NextResponse.json({ message: "Gagal menyimpan data purchase request" }, { status: 500 });
  }
}
