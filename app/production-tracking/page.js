"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProductionTrackingPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Released Production Orders</h1>

      {loading ? (
        <p>Loading...</p>
      ) : orders.length === 0 ? (
        <p>No released production orders available.</p>
      ) : (
        <table className="w-full border text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 border">Order ID</th>
              <th className="p-2 border">Item</th>
              <th className="p-2 border">Quantity</th>
              <th className="p-2 border">Due Date</th>
              <th className="p-2 border">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.prod_order_ID} className="text-center">
                <td className="p-2 border">{order.prod_order_ID}</td>
                <td className="p-2 border">{order.item_id}</td>
                <td className="p-2 border">{order.quantity}</td>
                <td className="p-2 border">{order.due_date?.slice(0, 10)}</td>
                <td className="p-2 border">
                  <button
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    onClick={() => handleTrackClick(order.prod_order_ID)}
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
