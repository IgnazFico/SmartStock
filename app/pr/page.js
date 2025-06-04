"use client";

import React, { useEffect, useState } from "react";
import PurchaseRequestTable from "@/components/PurchaseRequestTable";
import FormPurchaseRequest from "@/app/formPR/page";
import styles from "./style.module.css";

export default function PRPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const handleRecordClick = (record) => {
  };

  const handleNewPRSuccess = async () => {
  setShowForm(false);
  try {
    const res = await fetch("/api/pr");
    const data = await res.json();
    setRecords(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("Gagal fetch ulang data PR:", err);
    setRecords([]);
  }
};


  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/pr");
        const data = await res.json();
        setRecords(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Gagal ambil data:", err);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.pageTitle}>List Purchase Request</h1>

      {showForm && (
        <FormPurchaseRequest
          onSubmitSuccess={handleNewPRSuccess}
          onClose={() => setShowForm(false)}
        />
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <PurchaseRequestTable
          records={records}
          onRecordClick={handleRecordClick}  
          onAddNewPR={() => setShowForm(true)}
        />
      )}
    </div>
  );
}
