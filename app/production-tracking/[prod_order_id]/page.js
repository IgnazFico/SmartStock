import ProductionTrackingForm from "@/components/ProductionTrackingForm";

export default function ProductionTrackingPage({ params }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Production Tracking</h1>
      <ProductionTrackingForm prodOrderId={params.prod_order_id} />
    </div>
  );
}
