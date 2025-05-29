"use client";

import React, { useState, useEffect } from "react";
import styles from "./ProductionOrderForm.module.css";

export default function ProductionOrderForm({ order = {}, mode = "view" }) {
  const isView = mode === "view";

  const formatDateTimeLocal = (dateString) => {
    try {
      const date = new Date(dateString);
      return isNaN(date) ? "" : date.toISOString().slice(0, 16);
    } catch {
      return "";
    }
  };

  const [formData, setFormData] = useState({
    prod_order_ID: order.prod_order_ID || "",
    item_id: order.item_id || "",
    description: order.description || "",
    quantity: order.quantity || 0,
    routing: order.routing || "",
    order_date: formatDateTimeLocal(order.order_date) || "",
    due_date: formatDateTimeLocal(order.due_date) || "",
    status: order.status || "",
  });
  const [operations, setOperations] = useState([]);
  const [activeTab, setActiveTab] = useState("operations");
  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    if (mode === "create") {
      fetch("/api/getProductionOrderID")
        .then((res) => res.json())
        .then((data) =>
          setFormData((prev) => ({
            ...prev,
            prod_order_ID: data.prod_order_ID,
          }))
        );
    }
  }, [mode]);

  useEffect(() => {
    if (!formData.item_id) return;

    async function fetchItemDetails() {
      try {
        const res = await fetch(`/api/itemDetails?item_id=${formData.item_id}`);
        const data = await res.json();

        setFormData((prev) => ({
          ...prev,
          description: data.description || "",
          routing: data.process_id || "",
        }));
      } catch (err) {
        console.error("Failed to load item details:", err);
      }
    }

    fetchItemDetails();
  }, [formData.item_id]);

  useEffect(() => {
    if (!formData.routing) return;

    fetch(`/api/routingOperations?process_id=${formData.routing}`)
      .then((res) => res.json())
      .then((data) => {
        setOperations(data || []);
      })
      .catch((err) => {
        console.error("Failed to load routing operations:", err);
      });
  }, [formData.routing]);

  useEffect(() => {
    if (!formData.item_id) return;

    async function fetchMaterials() {
      try {
        const res = await fetch(
          `/api/materialEstimate?item_id=${formData.item_id}`
        );
        const data = await res.json();
        setMaterials(data);
      } catch (err) {
        console.error("Failed to load material estimates:", err);
      }
    }

    fetchMaterials();
  }, [formData.item_id]);

  const handleSubmit = async () => {
    let finalData = { ...formData };

    if (!formData.prod_order_ID) {
      const res = await fetch("/api/getNextProductionOrderID");
      const data = await res.json();
      finalData.prod_order_ID = data.prod_order_ID;
    }

    const payload = {
      ...formData,
      operations,
    };

    const res = await fetch("/api/saveProductionOrder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    alert(data.message || "Order created.");
  };

  const handleRelease = async () => {
    let finalData = { ...formData };

    const res = await fetch("/api/releaseProductionOrder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prod_order_ID: finalData.prod_order_ID }),
    });

    const data = await res.json();
    alert(data.message || "Order released.");
  };

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.title}>Production Order</h2>

      <div className={styles.formGrid}>
        {/* Left Section */}
        <div className={styles.formColumn}>
          <div className={styles.formGroup}>
            <label>Production Order</label>
            <input type="text" value={formData.prod_order_ID} readOnly />
          </div>
          <div className={styles.formGroup}>
            <label>Item</label>
            <input
              type="text"
              value={formData.item_id || ""}
              readOnly={isView}
              onChange={(e) =>
                !isView && setFormData({ ...formData, item_id: e.target.value })
              }
            />
          </div>
          <div className={styles.formGroup}>
            <label>Description</label>
            <input type="text" value={formData.description || ""} readOnly />
          </div>
          <div className={styles.formGroup}>
            <label>Quantity Ordered</label>
            <input
              type="number"
              value={formData.quantity || 0}
              readOnly={isView}
              onChange={(e) =>
                !isView &&
                setFormData({ ...formData, quantity: e.target.value })
              }
            />
          </div>
          <div className={styles.formGroup}>
            <label>Routing</label>
            <input
              type="text"
              value={formData.routing || ""}
              readOnly={isView}
              onChange={(e) =>
                !isView && setFormData({ ...formData, routing: e.target.value })
              }
            />
          </div>
        </div>

        {/* Right Section */}
        <div className={styles.formColumn}>
          <div className={styles.formGroup}>
            <label>Production Start</label>
            <input
              type="datetime-local"
              value={formData.order_date}
              readOnly={isView}
              onChange={(e) =>
                !isView &&
                setFormData({ ...formData, order_date: e.target.value })
              }
            />
          </div>
          <div className={styles.formGroup}>
            <label>Requested Delivery</label>
            <input
              type="datetime-local"
              value={formData.due_date}
              readOnly={isView}
              onChange={(e) =>
                !isView &&
                setFormData({ ...formData, due_date: e.target.value })
              }
            />
          </div>
          <div className={styles.formGroup}>
            <label>Status</label>
            <input type="text" value={formData.status} readOnly />
          </div>
        </div>
      </div>

      <div className={styles.tabHeader}>
        <button
          className={`${styles.tabButton} ${
            activeTab === "operations" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("operations")}
        >
          Production Planning Line
        </button>
        <button
          className={`${styles.tabButton} ${
            activeTab === "materials" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("materials")}
        >
          Estimated Materials Line
        </button>
      </div>
      {activeTab === "operations" && (
        <table className={styles.operationTable}>
          <thead>
            <tr>
              <th>Operation</th>
              <th>Next Operation</th>
              <th>Work Center</th>
              <th>Machine</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {operations.map((op, idx) => {
              const operationStep = (idx + 1) * 10;
              const nextStep = operations[idx + 1] ? (idx + 2) * 10 : 0;

              return (
                <tr key={idx}>
                  <td>
                    <input type="text" value={operationStep} readOnly />
                  </td>
                  <td>
                    <input type="text" value={nextStep} readOnly />
                  </td>
                  <td>
                    <input type="text" value={op.workCenter} />
                  </td>
                  <td>
                    <input type="text" value={op.machine} />
                  </td>
                  <td>
                    <input type="text" value={op.description} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {activeTab === "materials" && (
        <table className={styles.materialsTable}>
          <thead>
            <tr>
              <th>Material ID</th>
              <th>Description</th>
              <th>Required Qty</th>
              <th>Unit</th>
              <th>Inventory Available</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((mat, idx) => (
              <tr key={idx}>
                <td>{mat.material_id}</td>
                <td>{mat.description}</td>
                <td>{mat.required_qty}</td>
                <td>{mat.unit}</td>
                <td>{mat.available_qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button className={styles.addButton} onClick={handleSubmit}>
        Save Order
      </button>
      <button className={styles.addButton} onClick={handleRelease}>
        Release Order
      </button>
    </div>
  );
}
