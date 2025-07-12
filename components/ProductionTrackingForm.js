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

        const matRes = await fetch(
          `/api/processMaterials?item_id=${order.item_id}`
        );
        const processMaterials = await matRes.json(); // Should return: { [process_id]: [{ component_id, default_quantity }] }

        if (order.status === "In Progress") {
          const trackingRes = await fetch(
            `/api/productionTracking/${prodOrderId}`
          );
          const trackingData = await trackingRes.json();

          setOrderStatus(trackingData.status || order.status);

          setFormData([
            {
              process_id: trackingData.process_id,
              output_quantity: trackingData.output_quantity,
              status: trackingData.status,
              remarks: trackingData.remarks,
              materials: processMaterials[trackingData.process_id] || [],
            },
          ]);
        } else if (order.status === "Completed") {
          const trackingRes = await fetch(
            `/api/productionTracking/${prodOrderId}`
          );
          const trackingData = await trackingRes.json();

          const matTrackingRes = await fetch(
            `/api/productionMaterialsUsed?prod_order_id=${prodOrderId}`
          );
          const usedMaterials = await matTrackingRes.json();

          setOrderStatus(trackingData.status || order.status);

          const processGroupedMaterials = {};
          usedMaterials.forEach((mat) => {
            if (!processGroupedMaterials[mat.process_id]) {
              processGroupedMaterials[mat.process_id] = [];
            }
            processGroupedMaterials[mat.process_id].push({
              component_id: mat.component_id,
              quantity: mat.quantity,
            });
          });

          // Fill formData with fetched quantities
          setFormData(
            steps.map((step) => ({
              process_id: step.process_id,
              output_quantity: trackingData.output_quantity,
              status: trackingData.status,
              remarks: trackingData.remarks,
              materials: processGroupedMaterials[step.process_id] || [],
            }))
          );
        } else {
          // Initialize fresh formData with materials
          setFormData(
            steps.map((step) => ({
              process_id: step.process_id,
              output_quantity: 0,
              status: "Planned",
              remarks: "",
              materials:
                processMaterials[step.process_id]?.map((mat) => ({
                  component_id: mat.component_id,
                  quantity: 0,
                })) || [],
            }))
          );
        }
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
        body: JSON.stringify({ prod_order_id: prodOrderId }),
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

      {(orderStatus === "In Progress" || orderStatus === "Completed") && (
        <form onSubmit={handleSubmit}>
          {formData.length === 0 && (
            <p style={{ marginTop: "1rem", color: "gray" }}>
              No process steps found for this item.
            </p>
          )}

          {formData.map((step, idx) => {
            const stepInfo = processSteps.find(
              (p) => p.process_id === step.process_id
            );
            return (
              <div className={styles.card} key={idx}>
                <h4>
                  Process:{" "}
                  {stepInfo?.process_name || `Process ${step.process_id}`}
                </h4>

                {step.materials?.map((mat, midx) => (
                  <div key={midx}>
                    <label>Material {mat.component_id} Used</label>
                    <input
                      type="number"
                      value={mat.quantity}
                      readOnly={orderStatus === "Completed"}
                      onChange={(e) => {
                        if (orderStatus !== "Completed") {
                          const updated = [...formData];
                          updated[idx].materials[midx].quantity =
                            e.target.value;
                          setFormData(updated);
                        }
                      }}
                    />
                  </div>
                ))}

                <label>Output Quantity</label>
                <input
                  type="number"
                  value={step.output_quantity}
                  disabled={orderStatus === "Completed"}
                  onChange={(e) =>
                    handleChange(idx, "output_quantity", e.target.value)
                  }
                />

                <label>Remarks</label>
                <textarea
                  value={step.remarks}
                  disabled={orderStatus === "Completed"}
                  onChange={(e) => handleChange(idx, "remarks", e.target.value)}
                />
              </div>
            );
          })}

          {orderStatus === "In Progress" && formData.length > 0 && (
            <button type="submit" className={styles.submitBtn}>
              Complete Production
            </button>
          )}
        </form>
      )}
    </div>
  );
}
