import ProductionTrackingForm from "@/components/ProductionTrackingForm";

export default function ProductionTrackingPage({ params }) {
  return (
    <div className="p-6">
      <ProductionTrackingForm prodOrderId={params.prod_order_id} />
    </div>
  );
}
