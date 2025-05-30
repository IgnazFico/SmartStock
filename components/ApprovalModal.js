"use client";

import React, { useState, useEffect } from "react";
import styles from "./ApprovalModal.module.css";

const ApprovalModal = ({ record, onClose, refreshData, detail }) => {
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplierID, setSelectedSupplierID] = useState("");
  const [localRecord, setLocalRecord] = useState(record); // local copy of record

  useEffect(() => {
    setRemarks("");
    setLocalRecord(record); // update local copy if record changes

    async function fetchSuppliers() {
      try {
        const res = await fetch("/api/supplier");
        if (!res.ok) throw new Error("Gagal mengambil data supplier");
        const data = await res.json();
        setSuppliers(data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchSuppliers();
  }, [record]);

  const handleApproval = async (status) => {
    if (loading) return;
    setLoading(true);

    const approvalData = {
      pr_ID: localRecord.pr_ID,
      users_ID: localRecord.users_ID,
      approval_status: status,
      approval_date: new Date().toISOString(),
      remarks,
    };

    try {
      const res = await fetch("/api/approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(approvalData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(`Error: ${errorData.error || "Gagal mengirim approval"}`);
        setLoading(false);
        return;
      }

      alert(`PR ${status} berhasil!`);
      await refreshData();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat menyimpan approval.");
      setLoading(false);
    }
  };

  const handleConvertToPO = async () => {
    if (!selectedSupplierID) {
      alert("Pilih supplier terlebih dahulu sebelum convert ke PO.");
      return;
    }

    const poData = {
      pr_ID: localRecord.pr_ID,
      order_date: new Date().toISOString(),
      supplier_ID: selectedSupplierID,
      material_ID: localRecord.material_ID,
      quantity: Number(localRecord.quantity) || 0,
      status: "order",
      received_date: "",
    };

    setLoading(true);

    try {
      // Buat PO
      const res = await fetch("/api/po", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(poData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        alert(`Gagal convert ke PO: ${errorText}`);
        setLoading(false);
        return;
      }

      alert("PO berhasil dibuat!");

      // Update status PR lokal agar UI langsung update tanpa tutup modal
      setLocalRecord((prev) => ({ ...prev, status: "converted" }));

      // Refresh data di list utama
      await refreshData();

    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat membuat PO.");
    } finally {
      setLoading(false);
    }
  };

  if (!localRecord) return null;

  const isReadOnly = localRecord.status.toLowerCase() !== "pending";

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Approval Form</h2>
        <p><strong>PR ID:</strong> {localRecord.pr_ID}</p>
        <p><strong>User ID:</strong> {localRecord.users_ID}</p>
        <p><strong>Department:</strong> {localRecord.department}</p>
        <p><strong>Request Date:</strong> {localRecord.request_date ? new Date(localRecord.request_date).toISOString().split("T")[0] : ""}</p>
        <p><strong>Priority:</strong> {localRecord.priority}</p>
        <p><strong>Material ID:</strong> {localRecord.material_ID}</p>
        <p><strong>Quantity:</strong> {localRecord.quantity}</p>
        <p><strong>Status:</strong> {localRecord.status}</p>

        {isReadOnly && localRecord.status === "rejected" && (
          <p><strong>Remarks:</strong> {localRecord.remarks}</p>
        )}

        {!isReadOnly && (
          <>
            <textarea
              placeholder="Remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className={styles.remarksInput}
              disabled={loading}
            />
            <div className={styles.modalActions}>
              <button
                className={styles.approveButton}
                onClick={() => handleApproval("approved")}
                disabled={loading}
              >
                {loading ? "Processing..." : "approve"}
              </button>
              <button
                className={styles.rejectButton}
                onClick={() => handleApproval("rejected")}
                disabled={loading}
              >
                {loading ? "Processing..." : "reject"}
              </button>
            </div>
          </>
        )}

        {localRecord.status.toLowerCase() === "approved" && (
          <>
            <div>
              <label htmlFor="supplierSelect">
                <strong>Select Supplier for Convert to PO:</strong>
              </label>
              <select
                id="supplierSelect"
                value={selectedSupplierID}
                onChange={(e) => setSelectedSupplierID(e.target.value)}
                className={styles.supplierDropdown}
              >
                <option value="">-- Pilih Supplier --</option>
                {suppliers.map((s) => (
                  <option key={s.supplier_ID} value={s.supplier_ID}>
                    {s.supplier} ({s.supplier_ID})
                  </option>
                ))}
              </select>
            </div>
            <button
              className={styles.convertButton}
              onClick={handleConvertToPO}
              disabled={loading || !selectedSupplierID}
            >
              {loading ? "Processing..." : "Convert to PO"}
            </button>
          </>
        )}

        <button
          className={styles.closeButton}
          onClick={onClose}
          disabled={loading}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ApprovalModal;
