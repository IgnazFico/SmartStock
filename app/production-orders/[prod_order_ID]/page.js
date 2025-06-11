import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ProductionOrderForm from "@/components/ProductionOrderForm"; // adjust path if needed

export default async function ProductionOrderDetail({ params }) {
  const { status } = useSession();
  const router = useRouter();
  const { prod_order_id } = params;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status]);

  const res = await fetch(`http://localhost:3000/api/productionOrderList`, {
    cache: "no-store",
  });
  const data = await res.json();

  const order = data.find((o) => o.prod_order_id === prod_order_id);

  if (!order) return <div>Production Order Unavailable</div>;

  return (
    <div>
      <ProductionOrderForm order={order} mode="view" />
    </div>
  );
}
