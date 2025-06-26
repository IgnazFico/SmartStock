"use client";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ProductionTrackingForm from "@/components/ProductionTrackingForm";

export default function ProductionTrackingPage({ params }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status]);

  return (
    <div>
      <ProductionTrackingForm prodOrderId={params.prod_order_id} />
    </div>
  );
}
