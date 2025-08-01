import { NextResponse } from "next/server";
import connect from "../../../utils/db";

export async function GET() {
  try {
    const db = await connect();
    const prCollection = db.collection("purchase_requests");
    const prs = await prCollection.find({}).toArray();

    return NextResponse.json(prs, { status: 200 });
  } catch (error) {
    console.error("🔥 Gagal ambil data PR:", error);
    return NextResponse.json(
      { message: "Gagal ambil data purchase requests" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const db = await connect();
    const prCollection = db.collection("purchase_requests");
    const itemCollection = db.collection("purchase_requests_items");
    const approvalCollection = db.collection("approval");

    const newPR = await req.json();

    if (
      !newPR.request_date ||
      !newPR.department ||
      !Array.isArray(newPR.items) ||
      newPR.items.length === 0
    ) {
      return NextResponse.json(
        {
          message:
            "Data not completed (request_date, department, atau items kosong)",
        },
        { status: 400 }
      );
    }

    // Generate PR ID
    const allPRs = await prCollection.find({}).toArray();
    const lastNumber =
      allPRs
        .map((doc) => parseInt(doc.pr_ID?.slice(2) || "0"))
        .filter((num) => !isNaN(num))
        .sort((a, b) => b - a)[0] || 0;

    const nextPRNumber = lastNumber + 1;
    const pr_ID = `PR${String(nextPRNumber).padStart(5, "0")}`;
    const now = Date.now();

    // Simpan ke purchase_requests
    const prRecord = {
      pr_ID,
      users_ID: newPR.users_ID || "",
      department: newPR.department,
      request_date: new Date(newPR.request_date).toISOString(),
      priority: newPR.priority || "Medium",
      status: "Pending",
    };

    const prResult = await prCollection.insertOne(prRecord);
    if (!prResult.acknowledged) throw new Error("Gagal menyimpan data utama");

    // Simpan item ke purchase_request_items
    const itemDocs = newPR.items.map((item, idx) => ({
      request_item_ID: `PRI-${now}-${idx}`,
      pr_ID,
      material_ID: item.material_ID,
      quantity: Number(item.quantity),
    }));

    await itemCollection.insertMany(itemDocs);

    // Simpan approval
    const approvalRecord = {
      approval_ID: `APR-${now}`,
      pr_ID,
      users_ID: newPR.users_ID || "",
      approval_status: "Pending",
      approval_date: new Date().toISOString(),
      remarks: "",
    };

    await approvalCollection.insertOne(approvalRecord);

    return NextResponse.json(
      { pr_ID, itemCount: itemDocs.length },
      { status: 201 }
    );
  } catch (err) {
    console.error("🔥 Error saving PR:", err);
    return NextResponse.json(
      { message: "Gagal menyimpan data purchase request" },
      { status: 500 }
    );
  }
}
