import ProductionOrderForm from "@/components/ProductionOrderForm"; // adjust path if needed

export default async function ProductionOrderDetail({ params }) {
  const { prod_order_ID } = params;

  const res = await fetch(`http://localhost:3000/api/productionOrderList`, {
    cache: "no-store",
  });
  const data = await res.json();

  const order = data.find((o) => o.prod_order_ID === prod_order_ID);

  if (!order)
    return <div className="p-6 text-red-600">Production Order Unavailable</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Production Order Details</h1>
      <ProductionOrderForm order={order} mode="view" />
    </div>
  );
}
