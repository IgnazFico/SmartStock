"use client";

import React, { useState, useEffect } from "react";
import styles from "./style.module.css";
import { useSession } from "next-auth/react";

export default function FormPurchaseRequest({ onSubmitSuccess, onClose }) {
  const { data: session } = useSession();

  const [formData, setFormData] = useState({
    users_ID: "",
    department: "",
    request_date: "",
    priority: "medium",
  });

  const [items, setItems] = useState([{ material_ID: "", quantity: "" }]);
  const [materials, setMaterials] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Set users_ID dan department dari session
  useEffect(() => {
    if (session?.user) {
      setFormData((prev) => ({
        ...prev,
        users_ID: session.user.users_ID || "",
        department: session.user.department || "",
      }));
    }
  }, [session]);

  // Fetch daftar material dari API
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const res = await fetch("/api/materials");
        const data = await res.json();
        setMaterials(data || []);
      } catch {
        setMaterials([]);
      }
    };
    fetchMaterials();
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const updatedItems = [...items];
    updatedItems[index][name] = value;
    setItems(updatedItems);
  };

  const addItem = () => {
    setItems([...items, { material_ID: "", quantity: "" }]);
  };

  const removeItem = (index) => {
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setItems(updatedItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const isValid = items.every(
      (item) => item.material_ID && item.quantity > 0
    );
    if (!isValid) {
      setError("Please fill in valid material and quantity for all items.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        items: items.map((item) => ({
          material_ID: item.material_ID,
          quantity: Number(item.quantity),
        })),
      };

      const res = await fetch("/api/pr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal menyimpan data PR.");
      }

      const saved = await res.json();
      alert(`✅ Purchase Request successfully saved! PR ID: ${saved.pr_ID}`);
      onSubmitSuccess?.(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.formWrapper}>
      <div className={styles.formHeader}>
        <h2 className={styles.title}>Form Purchase Request</h2>
        <button onClick={onClose} className={styles.closeButton} type="button">
          &times;
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.formLabel}>
          User ID:
          <input
            name="users_ID"
            className={styles.formInput}
            value={formData.users_ID}
            disabled
            placeholder="Auto from login user"
          />
        </label>

        <label className={styles.formLabel}>
          Department:
          <input
            name="department"
            className={styles.formInput}
            value={formData.department}
            disabled
            placeholder="Auto from login user"
          />
        </label>

        <label className={styles.formLabel}>
          Priority:
          <select
            name="priority"
            className={styles.formInput}
            value={formData.priority}
            onChange={handleFormChange}
            required
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>

        <label className={styles.formLabel}>
          Request Date:
          <input
            type="date"
            name="request_date"
            className={styles.formInput}
            value={formData.request_date}
            onChange={handleFormChange}
            required
          />
        </label>

        <hr />

        <h4>Items</h4>
        {items.map((item, index) => (
          <div key={index} className={styles.itemRow}>
            <label>
              Material:
              <select
                name="material_ID"
                value={item.material_ID}
                onChange={(e) => handleItemChange(index, e)}
                className={styles.formInput}
                required
              >
                <option value="">-- Select Material --</option>
                {materials.map((mat) => (
                  <option key={mat.material_ID} value={mat.material_ID}>
                    {mat.material_ID} - {mat.material}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Quantity:
              <input
                type="number"
                name="quantity"
                min="1"
                value={item.quantity}
                onChange={(e) => handleItemChange(index, e)}
                className={styles.formInput}
                required
              />
            </label>

            {items.length > 1 && (
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

        <button type="submit" className={styles.formButton} disabled={loading}>
          {loading ? "Menyimpan..." : "Save PR"}
        </button>
      </form>
    </div>
  );
}
