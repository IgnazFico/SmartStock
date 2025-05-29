"use client";

import React, { useState, useEffect } from "react";
import styles from "./style.module.css";

export default function FormPurchaseOrder({ onSubmitSuccess, onClose }) {
  const [formData, setFormData] = useState({
    order_date: "",
    supplier_ID: "",
    material_ID: "",
    quantity: "",
    received_date: "",
    status: "order",
  });
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch supplier dan material dari API
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [supplierRes, materialRes] = await Promise.all([
          fetch("/api/supplier"),
          fetch("/api/materials"), 
        ]);
        const supplierData = await supplierRes.json();
        const materialData = await materialRes.json();

        setSuppliers(supplierData);
        setMaterials(materialData);
      } catch (err) {
        setError("Gagal memuat data supplier/material");
      }
    };
    fetchDropdownData();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      ...formData,
      quantity: Number(formData.quantity),
    };

    try {
      const res = await fetch("/api/po", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Gagal menyimpan data PO");
      }

      const savedPO = await res.json();
      onSubmitSuccess?.(savedPO);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.formWrapper} style={{ position: "relative" }}>
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: "8px",
          right: "8px",
          background: "transparent",
          border: "none",
          fontSize: "24px",
          cursor: "pointer",
          lineHeight: 1,
        }}
        aria-label="Close form"
        type="button"
      >
        &times;
      </button>

      <h2 className={styles.title}>Form Purchase Order</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.formLabel}>
          Order Date:
          <input
            className={styles.formInput}
            type="date"
            name="order_date"
            value={formData.order_date}
            onChange={handleChange}
            required
          />
        </label>

        <label className={styles.formLabel}>
          Supplier:
          <select
            className={styles.formInput}
            name="supplier_ID"
            value={formData.supplier_ID}
            onChange={handleChange}
            required
          >
            <option value="">-- Select Supplier --</option>
            {suppliers.map((s) => (
              <option key={s.supplier_ID} value={s.supplier_ID}>
                {s.supplier_ID} - {s.supplier}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.formLabel}>
          Material:
          <select
            className={styles.formInput}
            name="material_ID"
            value={formData.material_ID}
            onChange={handleChange}
            required
          >
            <option value="">-- Select Material --</option>
            {materials.map((m) => (
              <option key={m.material_ID} value={m.material_ID}>
                {m.material_ID} - {m.material}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.formLabel}>
          Quantity:
          <input
            className={styles.formInput}
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            required
            min={1}
          />
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.formButton} type="submit" disabled={loading}>
          {loading ? "Menyimpan..." : "Simpan PO"}
        </button>
      </form>
    </div>
  );
}
