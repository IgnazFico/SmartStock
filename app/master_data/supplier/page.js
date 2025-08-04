"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DataTable from "../../../components/DataTable.js";
import DataModal from "../../../components/DataModal.js";
import styles from "./style.module.css";

export default function InsertSupplierData() {
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const router = useRouter();

  const [isSupplierModalOpen, setSupplierModalOpen] = useState(false);
  const [supplierLoading, setSupplierLoading] = useState(false);
  const [supplierError, setSupplierError] = useState(null);

  const supplierColumns = [
    { key: "supplier_ID", label: "Supplier ID" },
    { key: "supplier", label: "Supplier Name" },
    { key: "phone", label: "Phone" },
    { key: "address", label: "Address" },
  ];

  const [supplierData, setSupplierData] = useState([]);

  useEffect(() => {
    const fetchSuppliers = async () => {
      const response = await fetch("/api/getSuppliers");
      const data = await response.json();
      setSupplierData(data);
    };
    fetchSuppliers();
    const interval = setInterval(fetchSuppliers, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAddSupplier = async (formData) => {
    setSupplierLoading(true);
    setSupplierError(null);
    try {
      const res = await fetch("/api/insertSupplier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to insert supplier");
      setSupplierModalOpen(false);
      alert("Supplier added!");
      // Refresh supplier data
      const response = await fetch("/api/getSuppliers");
      const data = await response.json();
      setSupplierData(data);
    } catch (err) {
      setSupplierError(err.message);
    } finally {
      setSupplierLoading(false);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!session) {
    router.push("/auth");
    return null;
  }

  return (
    <div className={styles.container}>
      <div>
        <h1>Supplier Master Data</h1>
        <div className={styles.buttonGroup}>
          <button
            className={styles.button}
            onClick={() => setSupplierModalOpen(true)}
          >
            Add Supplier
          </button>
        </div>

        <div className={styles.tablesContainer}>
          <div className={styles.itemsTable}>
            <h2>Supplier List</h2>
            <DataTable data={supplierData} columns={supplierColumns} />
          </div>
        </div>
      </div>
      <DataModal
        isOpen={isSupplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        onSubmit={handleAddSupplier}
        fields={["supplier_ID", "supplier", "phone", "address"]}
        loading={supplierLoading}
        error={supplierError}
        title="Add New Supplier"
      />
    </div>
  );
}
