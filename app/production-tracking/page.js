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

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Track Production Orders</h1>

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
              <th>Item</th>
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
