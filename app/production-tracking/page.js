"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./styles.module.css"; // import the styles

export default function ProductionTrackingPage() {
  const { status } = useSession();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status]);

  useEffect(() => {
    async function fetchReleasedOrders() {
      try {
        const res = await fetch("/api/getReleasedOrders");
        const data = await res.json();
        setOrders(data.orders || []);
      } catch (err) {
        console.error("Failed to fetch released orders:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchReleasedOrders();
  }, []);

  const handleTrackClick = (orderId) => {
    router.push(`/production-tracking/${orderId}`);
  };

  const exportToCSV = async () => {
    try {
      // Fetch production tracking data
      const trackingRes = await fetch("/api/getProductionTracking");
      const trackingData = await trackingRes.json();

      // Fetch production material tracking data
      const materialRes = await fetch("/api/getProductionMaterialTracking");
      const materialData = await materialRes.json();

      // Merge data based on prod_order_id
      const mergedData = trackingData.map((tracking) => {
        const relatedMaterials = materialData.filter(
          (mat) => mat.prod_order_id === tracking.prod_order_id
        );

        return {
          prod_order_id: tracking.prod_order_id,
          process_id: tracking.process_id,
          output_quantity: tracking.output_quantity,
          status: tracking.status,
          remarks: tracking.remarks || "",
          materials:
            relatedMaterials.length > 0
              ? relatedMaterials
              : [{ component_id: "-", quantity: "-" }], // default when no material tracking
        };
      });

      const headers = [
        "Order ID",
        "Routing",
        "Output Quantity",
        "Status",
        "Remarks",
        "Component (Part Number)",
        "Component Quantity",
      ];

      const rows = mergedData.flatMap((entry) =>
        entry.materials.map((mat) => [
          entry.prod_order_id,
          entry.process_id,
          entry.output_quantity,
          entry.status,
          entry.remarks,
          mat.component_id,
          mat.quantity,
        ])
      );

      // Create CSV content
      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n");

      // Download CSV
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "production_tracking.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to export CSV:", error);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Track Production Orders</h1>
        <button onClick={exportToCSV} className={styles.exportButton}>
          ⬇ Export to CSV
        </button>
      </div>

      {loading ? (
        <p className={styles.message}>Loading...</p>
      ) : orders.length === 0 ? (
        <p className={styles.message}>
          No released production orders available.
        </p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Part Number</th>
              <th>Quantity</th>
              <th>Due Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.prod_order_id}>
                <td>{order.prod_order_id}</td>
                <td>{order.item_id}</td>
                <td>{order.quantity}</td>
                <td>{order.due_date?.slice(0, 10)}</td>
                <td>
                  <button
                    className={styles.trackButton}
                    onClick={() => handleTrackClick(order.prod_order_id)}
                  >
                    Track
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
