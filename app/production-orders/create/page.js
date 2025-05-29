import ProductionOrderForm from "@/components/ProductionOrderForm";

export default function CreateProductionOrderPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">New Production Order</h1>
      <ProductionOrderForm mode="create" />
    </div>
  );
}
