"use client";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ProductionOrderForm from "@/components/ProductionOrderForm";

export default function CreateProductionOrderPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status]);

  return (
    <div>
      <ProductionOrderForm mode="create" />
    </div>
  );
}
