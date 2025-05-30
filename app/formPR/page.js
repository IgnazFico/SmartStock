"use client";

import React, { useState, useEffect } from "react";
import styles from "./style.module.css";

export default function FormPurchaseRequest({ onSubmitSuccess, onClose }) {
  const [formData, setFormData] = useState({
    pr_ID: "",
    users_ID: "USR001",
    department: "",
    request_date: "",
    material_ID: "",
    quantity: "",
    priority: "medium",
    status: "",
  });

  const [departments, setDepartments] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
  fetch("/api/users/departments")
    .then((res) => res.json())
    .then((data) => {
      console.log("Departments:", data);
      setDepartments(data);
    })
    .catch(() => setDepartments([]));
}, []);

useEffect(() => {
  fetch("/api/materials")
    .then((res) => res.json())
    .then((data) => {
      console.log("Materials:", data);
      setMaterials(data);
    })
    .catch(() => setMaterials([]));
}, []);


  // Auto fill user ID based on department
  useEffect(() => {
  if (formData.department) {
    fetch(`/api/users/by-department?department=${formData.department}`)
      .then((res) => res.json())
      .then((users) => {
        console.log("Users dari API:", users);
        if (Array.isArray(users) && users.length > 0) {
          console.log("Set users_id ke:", users[0].users_ID);
          setFormData((prev) => ({ ...prev, users_ID: users[0].users_ID }));
        } else {
          setFormData((prev) => ({ ...prev, users_ID: "" }));
        }
      })
      .catch(() => setFormData((prev) => ({ ...prev, users_ID: "" })));
  } else {
    setFormData((prev) => ({ ...prev, users_ID: "" }));
  }
}, [formData.department]);


useEffect(() => {
  console.log("formData berubah:", formData);
}, [formData]);



  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { pr_ID, ...payload } = formData;
    payload.quantity = Number(payload.quantity);
    console.log("Payload yang dikirim ke API:", payload); 


    try {
      const res = await fetch("/api/pr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Gagal menyimpan data PR");
      }

      const savedPR = await res.json();
      onSubmitSuccess?.(savedPR);
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

      <h2 className={styles.title}>Form Purchase Request</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* User ID readonly */}
        <label className={styles.formLabel}>
          User ID:
          <input
            className={styles.formInput}
            name="users_ID"
            value={formData.users_ID}
            disabled
            placeholder="Automatic User ID by Department"
            required
          />
        </label>

        {/* Department dropdown */}
        <label className={styles.formLabel}>
          Department:
          <select
            className={styles.formInput}
            name="department"
            value={formData.department}
            onChange={handleChange}
            required
          >
            <option value="">-- Select Department --</option>
            {departments.map((dept) => (
            <option key={dept} value={dept}>
             {dept}
            </option>
            ))}
          </select>
        </label>

        {/* Priority */}
        <label className={styles.formLabel}>
          Priority:
          <select
            className={styles.formInput}
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            required
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>

        {/* Request Date */}
        <label className={styles.formLabel}>
          Request Date:
          <input
            className={styles.formInput}
            type="date"
            name="request_date"
            value={formData.request_date}
            onChange={handleChange}
            required
          />
        </label>

        {/* Material dropdown */}
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
            {materials.map((mat) => (
            <option key={mat.material_ID} value={mat.material_ID}>
             {mat.material_ID} - {mat.material}
            </option>
            ))}
          </select>
        </label>

        {/* Quantity */}
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
          {loading ? "Menyimpan..." : "Simpan PR"}
        </button>
      </form>
    </div>
  );
}
