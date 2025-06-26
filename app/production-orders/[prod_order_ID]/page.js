"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProductionOrderForm from "@/components/ProductionOrderForm";

export default function ProductionOrderDetail({ params }) {
  const { status } = useSession();
  const router = useRouter();
  const { prod_order_id } = params;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status]);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/productionOrderList`, {
          cache: "no-store",
        });
        const data = await res.json();
        const foundOrder = data.find((o) => o.prod_order_id === prod_order_id);
        setOrder(foundOrder || null);
      } catch (error) {
        console.error("Failed to fetch order:", error);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [prod_order_id]);

  if (loading) return <p>Loading...</p>;
  if (!order) return <p>Production Order Unavailable</p>;

  return (
    <div>
      <ProductionOrderForm order={order} mode="view" />
    </div>
  );
}
