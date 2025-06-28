"use client";

import React, { useEffect, useState } from "react";
import PurchaseOrderTable from "@/components/PurchaseOrderTable";
import FormPurchaseOrder from "@/app/formPO/page";
import styles from "./style.module.css";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function POPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  // Autentikasi dan Fetch PO Data
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
      return;
    }

    if (status === "authenticated") {
      const fetchData = async () => {
        try {
          const res = await fetch("/api/po");
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
    }
  }, [status]);

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

  // Loading saat session atau data belum siap
  if (status === "loading" || loading) return <p>Loading...</p>;

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.pageTitle}>Purchase Order List</h1>

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
