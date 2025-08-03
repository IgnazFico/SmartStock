import { NextResponse } from "next/server";
import connect from "@/utils/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    console.log("=== [DEBUG APPROVAL API] Session data ===");
    console.log("User from session:", session?.user);
    console.log("Position:", session?.user?.position);
    console.log("Department:", session?.user?.department);

    if (!session || session.user.position?.toLowerCase() !== "supervisor") {
      return NextResponse.json(
        { error: "Unauthorized. Only supervisors can approve or reject." },
        { status: 403 }
      );
    }

    const data = await req.json();
    const db = await connect();

    const { pr_ID, users_ID, approval_status, approval_date, remarks } = data;

    if (!pr_ID || !approval_status || !users_ID) {
      return NextResponse.json(
        { error: "pr_ID, approval_status, dan users_ID wajib diisi" },
        { status: 400 }
      );
    }

    const validStatuses = ["Approved", "Rejected", "Pending"];
    if (!validStatuses.includes(approval_status)) {
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
    if (prData.status && prData.status !== "Pending") {
      return NextResponse.json(
        {
          error: `PR already have status '${prData.status}', cannot be approved/rejected again.`,
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
            approval_status: approval_status,
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
        approval_status: approval_status,
        approval_date: approval_date ? new Date(approval_date) : new Date(),
        remarks: remarks || "",
      });
    }

    // Update status dan remarks di koleksi purchase_requests
    const updateFields = { status: approval_status };
    if (approval_status === "Rejected") updateFields.remarks = remarks || "";

    const updateResult = await db
      .collection("purchase_requests")
      .updateOne({ pr_ID }, { $set: updateFields });

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Status PR tidak ditemukan atau tidak diperbarui" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Approval successfully saved and PR status updated" },
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
