"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./styles.module.css";

export default function ProductionOrders() {
  const { status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status]);

  useEffect(() => {
    fetch("/api/productionOrderList", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading production orders:", err);
        setLoading(false);
      });
  }, []);

  const handleRowClick = (prod_order_id) => {
    router.push(`/production-orders/${prod_order_id}`);
  };

  const handleCreate = () => {
    router.push("/production-orders/create");
  };

  const exportToCSV = () => {
    if (!orders.length) return;

    const headers = [
      "Order ID",
      "Item ID",
      "Quantity",
      "Order Date",
      "Due Date",
      "Status",
    ];
    const rows = orders.map((order) => [
      order.prod_order_id,
      order.item_id,
      order.quantity,
      new Date(order.order_date).toLocaleDateString(),
      new Date(order.due_date).toLocaleDateString(),
      order.status,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "production_orders.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Production Orders</h1>
        <div>
          <button onClick={handleCreate} className={styles.createButton}>
            + Create New Order
          </button>
          <button
            onClick={exportToCSV}
            className={styles.createButton}
            style={{ marginLeft: "10px" }}
          >
            ⬇ Export to CSV
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Part Number</th>
              <th>Quantity</th>
              <th>Order Date</th>
              <th>Due Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.prod_order_id}
                className={styles.clickableRow}
                onClick={() => handleRowClick(order.prod_order_id)}
              >
                <td>{order.prod_order_id}</td>
                <td>{order.item_id}</td>
                <td>{order.quantity}</td>
                <td>{new Date(order.order_date).toLocaleDateString()}</td>
                <td>{new Date(order.due_date).toLocaleDateString()}</td>
                <td>{order.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
