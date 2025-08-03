"use client";

import React, { useState, useEffect } from "react";
import styles from "./style.module.css";

export default function FormPurchaseOrder({ onSubmitSuccess, onClose }) {
  const [formData, setFormData] = useState({
    order_date: "",
    supplier_ID: "",
    received_date: "",
    status: "Pending",
  });

  const [orderItems, setOrderItems] = useState([
    { material_ID: "", quantity: 1 },
  ]);

  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...orderItems];
    updatedItems[index][field] = field === "quantity" ? Number(value) : value;
    setOrderItems(updatedItems);
  };

  const addItem = () => {
    setOrderItems((prev) => [...prev, { material_ID: "", quantity: 1 }]);
  };

  const removeItem = (index) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      order_date: formData.order_date,
      supplier_ID: formData.supplier_ID,
      received_date: formData.received_date,
      items: orderItems,
    };

    try {
      console.log("📦 Payload yang dikirim ke API:", [payload]);

      const res = await fetch("/api/po/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([payload]),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Fail saving PO Data");
      }

      const savedPO = await res.json();
      alert(savedPO.message);
      onSubmitSuccess?.(savedPO);
    } catch (err) {
      console.error("❌ Error saat submit PO:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.formWrapper}>
      <div className={styles.formHeader}>
        <h2 className={styles.title}>Form Purchase Order</h2>
        <button
          onClick={onClose}
          className={styles.closeButton}
          aria-label="Close form"
          type="button"
        >
          &times;
        </button>
      </div>

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

        <hr />
        <h3>PO Items</h3>
        {orderItems.map((item, index) => (
          <div key={index} className={styles.itemRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Material:
                <select
                  className={styles.formInput}
                  value={item.material_ID}
                  onChange={(e) =>
                    handleItemChange(index, "material_ID", e.target.value)
                  }
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
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Quantity:
                <input
                  className={styles.formInput}
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    handleItemChange(index, "quantity", e.target.value)
                  }
                  required
                  min={1}
                />
              </label>
            </div>

            {orderItems.length > 1 && (
              <button
                type="button"
                onClick={() => removeItem(index)}
                className={styles.removeButton}
              >
                Remove
              </button>
            )}
          </div>
        ))}

        <button type="button" onClick={addItem} className={styles.addButton}>
          + Add Item
        </button>

        {error && <p className={styles.error}>{error}</p>}

        <hr />
        <button className={styles.formButton} type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save PO"}
        </button>
      </form>
    </div>
  );
}
