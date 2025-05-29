"use client";

import React, { useState, useEffect } from "react";
import styles from "./ProductionTrackingForm.module.css";

export default function ProductionTrackingForm({ prodOrderId }) {
  const [itemId, setItemId] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [processSteps, setProcessSteps] = useState([]);
  const [formData, setFormData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const orderRes = await fetch(`/api/productionOrders/${prodOrderId}`);
        const order = await orderRes.json();

        if (!order.item_id) return;

        setItemId(order.item_id);
        setOrderStatus(order.status || "Released");

        const stepRes = await fetch(`/api/process?item_id=${order.item_id}`);
        const steps = await stepRes.json();

        setProcessSteps(steps);

        setFormData(
          steps.map((step) => ({
            process_id: step.process_ID,
            input_quantity: 0,
            output_quantity: 0,
            status: "Planned",
            remarks: "",
          }))
        );
      } catch (err) {
        console.error("Error loading tracking data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [prodOrderId]);

  const handleChange = (index, field, value) => {
    const updated = [...formData];
    updated[index][field] = value;
    setFormData(updated);
  };

  const handleStartProduction = async () => {
    try {
      const res = await fetch("/api/startProduction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prod_order_ID: prodOrderId }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Production started.");
        setOrderStatus("In Progress");
      } else {
        alert(data.message || "Failed to start production.");
      }
    } catch (err) {
      console.error("Start production error:", err);
      alert("An error occurred.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = formData.map((step) => ({
      prod_order_id: prodOrderId,
      ...step,
    }));

    const res = await fetch("/api/productionTracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    alert(data.message || "Tracking submitted.");
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className={styles.container}>
      <h2>Production Tracking</h2>
      <p>
        <strong>Production Order:</strong> {prodOrderId}
      </p>
      <p>
        <strong>Item:</strong> {itemId}
      </p>
      <p>
        <strong>Status:</strong> {orderStatus}
      </p>

      {orderStatus === "Released" && (
        <button
          onClick={handleStartProduction}
          className={styles.submitBtn}
          style={{ marginTop: "1rem" }}
        >
          Start Production
        </button>
      )}

      {orderStatus === "In Progress" && (
        <form onSubmit={handleSubmit}>
          {formData.length === 0 && (
            <p style={{ marginTop: "1rem", color: "gray" }}>
              No process steps found for this item.
            </p>
          )}

          {formData.map((step, idx) => (
            <div className={styles.card} key={idx}>
              <h4>
                Step {idx + 1}:{" "}
                {processSteps[idx]?.process_name || "Unnamed Step"}
              </h4>

              <label>Input Quantity</label>
              <input
                type="number"
                placeholder="Input Quantity"
                value={step.input_quantity}
                onChange={(e) =>
                  handleChange(idx, "input_quantity", e.target.value)
                }
              />
              <label>Output Quantity</label>
              <input
                type="number"
                placeholder="Output Quantity"
                value={step.output_quantity}
                onChange={(e) =>
                  handleChange(idx, "output_quantity", e.target.value)
                }
              />
              <textarea
                placeholder="Remarks"
                value={step.remarks}
                onChange={(e) => handleChange(idx, "remarks", e.target.value)}
              />
            </div>
          ))}

          {formData.length > 0 && (
            <button type="submit" className={styles.submitBtn}>
              Complete Production
            </button>
          )}
        </form>
      )}
    </div>
  );
}
