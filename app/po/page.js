"use client";

import React, { useEffect, useState } from "react";
import PurchaseOrderTable from "@/components/PurchaseOrderTable";
import FormPurchaseOrder from "@/app/formPO/page";
import styles from "./style.module.css";

export default function POPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const handleRecordClick = (record) => {
    alert(`PO dipilih: ${record.po_ID}`);
  };

  const handleNewPOSuccess = async () => {
  setShowForm(false);
  try {
    const res = await fetch("/api/po");
    const data = await res.json();
    setRecords(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("Gagal fetch ulang data PO:", err);
    setRecords([]);
  }
};

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/po");
        const data = await res.json();
        setRecords(data);
      } catch (err) {
        console.error("Gagal ambil data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.pageTitle}>List Purchase Order</h1>

      {showForm && (
        <FormPurchaseOrder
          onSubmitSuccess={handleNewPOSuccess}
          onClose={() => setShowForm(false)}
        />
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <PurchaseOrderTable
          records={records}
          handleRecordClick={handleRecordClick}
          onAddNewPO={() => setShowForm(true)}
        />
      )}
    </div>
  );
}
