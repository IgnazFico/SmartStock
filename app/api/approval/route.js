import { NextResponse } from "next/server";
import connect from "@/utils/db";

export async function POST(req) {
  try {
    const data = await req.json();
    const db = await connect();

    const {
      pr_ID,
      users_ID,
      approval_status,
      approval_date,
      remarks,
    } = data;

    if (!pr_ID || !approval_status || !users_ID) {
      return NextResponse.json(
        { error: "pr_ID, approval_status, dan users_ID wajib diisi" },
        { status: 400 }
      );
    }

    const statusLower = approval_status.toLowerCase();
    if (!["approved", "rejected", "pending"].includes(statusLower)) {
      return NextResponse.json(
        { error: "Status approval tidak valid" },
        { status: 400 }
      );
    }

    // Cari approval existing berdasarkan pr_ID & users_ID
    const existingApproval = await db.collection("approval").findOne({
      pr_ID,
      users_ID,
    });

    // Cari data PR
    const prData = await db.collection("purchase_requests").findOne({ pr_ID });
    if (!prData) {
      return NextResponse.json(
        { error: "PR tidak ditemukan" },
        { status: 404 }
      );
    }

    // Jika PR sudah approved/rejected, blokir perubahan lagi
    if (prData.status && prData.status.toLowerCase() !== "pending") {
      return NextResponse.json(
        {
          error: `PR sudah berstatus '${prData.status}', tidak bisa di-approve/reject lagi.`,
        },
        { status: 409 }
      );
    }

    if (existingApproval) {
      // Jika approval sudah ada, update record tersebut
      await db.collection("approval").updateOne(
        { _id: existingApproval._id },
        {
          $set: {
            approval_status: statusLower,
            approval_date: approval_date ? new Date(approval_date) : new Date(),
            remarks: remarks || "",
          },
        }
      );
    } else {
      // Jika belum ada approval, insert baru
      const approval_ID = `APR-${Date.now()}`;
      await db.collection("approval").insertOne({
        approval_ID,
        pr_ID,
        users_ID,
        approval_status: statusLower,
        approval_date: approval_date ? new Date(approval_date) : new Date(),
        remarks: remarks || "",
      });
    }

    // Update status dan remarks di koleksi purchase_requests
    const updateFields = { status: statusLower };
    if (statusLower === "rejected") updateFields.remarks = remarks || "";

    const updateResult = await db.collection("purchase_requests").updateOne(
      { pr_ID },
      { $set: updateFields }
    );

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Status PR tidak ditemukan atau tidak diperbarui" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Approval berhasil disimpan dan status PR diperbarui" },
      { status: 200 }
    );
  } catch (error) {
    console.error("🔥 Error saving approval:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan approval" },
      { status: 500 }
    );
  }
}
