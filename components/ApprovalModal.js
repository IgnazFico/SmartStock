"use client";

import React, { useState, useEffect } from "react";
import styles from "./ApprovalModal.module.css";
import { useSession } from "next-auth/react";

const ApprovalModal = ({ record, onClose, refreshData, detail }) => {
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const { data: session } = useSession();

  useEffect(() => {
    setRemarks("");
    setItems([]);

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

    async function fetchItems(pr_ID) {
      try {
        const res = await fetch(`/api/pr-items?pr_ID=${pr_ID}`);
        if (!res.ok) throw new Error("Gagal mengambil data item PR");
        const data = await res.json();

        // Set default selectedSupplierID kosong untuk setiap item
        const itemsWithSuppliers = data.map((item) => ({
          ...item,
          selectedSupplierID: "",
        }));
        setItems(itemsWithSuppliers);
      } catch (err) {
        console.error(err);
      }
    }

    if (record?.pr_ID) {
      fetchItems(record.pr_ID);
    }

    fetchSuppliers();
  }, [record]);

  const handleApproval = async (status) => {
    if (loading) return;
    setLoading(true);

    const approvalData = {
      pr_ID: record.pr_ID,
      users_ID: record.users_ID,
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

      alert(`PR ${status}`);
      await refreshData();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat menyimpan approval.");
      setLoading(false);
    }
  };

  const handleSupplierChange = (request_item_ID, supplierID) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.request_item_ID === request_item_ID
          ? { ...item, selectedSupplierID: supplierID }
          : item
      )
    );
  };

  const handleConvertToPO = async () => {
    // Cek semua item sudah punya supplier dipilih
    for (const item of items) {
      if (!item.selectedSupplierID) {
        alert(
          `Supplier not yet selected for materials ${item.material_ID}. Please select a supplier.`
        );
        return;
      }
    }

    if (items.length === 0) {
      alert("Tidak ada item untuk dibuat PO.");
      return;
    }

    setLoading(true);

    try {
      // Group items berdasarkan selectedSupplierID
      const groupedBySupplier = items.reduce((acc, item) => {
        const supID = item.selectedSupplierID;
        if (!acc[supID]) acc[supID] = [];
        acc[supID].push(item);
        return acc;
      }, {});

      // Bentuk payload array PO: 1 PO per supplier dengan items array
      const poPayload = Object.entries(groupedBySupplier).map(
        ([supplier_ID, groupedItems]) => ({
          pr_ID: record.pr_ID,
          order_date: new Date().toISOString(),
          supplier_ID,
          items: groupedItems.map((i) => ({
            material_ID: i.material_ID,
            quantity: Number(i.quantity) || 0,
          })),
          status: "order",
          received_date: "",
        })
      );

      // Kirim bulk PO ke endpoint
      const res = await fetch("/api/po/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(poPayload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        alert(`Failed to convert to PO: ${errorText}`);
        setLoading(false);
        return;
      }

      alert("PO successfully created for all suppliers!");
      await refreshData();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat membuat PO.");
    } finally {
      setLoading(false);
    }
  };

  if (!record) return null;

  const isReadOnly = record.status.toLowerCase() !== "pending";

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Approval Form</h2>
        <p>
          <strong>PR ID:</strong> {record.pr_ID}
        </p>
        <p>
          <strong>User ID:</strong> {record.users_ID}
        </p>
        <p>
          <strong>Department:</strong> {record.department}
        </p>
        <p>
          <strong>Request Date:</strong>{" "}
          {record.request_date
            ? new Date(record.request_date).toISOString().split("T")[0]
            : ""}
        </p>
        <p>
          <strong>Priority:</strong> {record.priority}
        </p>
        <p>
          <strong>Status:</strong> {record.status}
        </p>

        <h3>Items:</h3>
        {items.length === 0 && <p>Tidak ada item.</p>}
        <ul>
          {items.map((item) => (
            <li key={item.request_item_ID} style={{ marginBottom: "12px" }}>
              <div>
                Material ID: {item.material_ID} | Quantity: {item.quantity}
              </div>
              {record.status.toLowerCase() === "approved" && (
                <div>
                  <label>
                    <select
                      value={item.selectedSupplierID}
                      onChange={(e) =>
                        handleSupplierChange(
                          item.request_item_ID,
                          e.target.value
                        )
                      }
                      disabled={loading}
                      className={styles.supplierDropdown}
                    >
                      <option value="">-- Select Supplier --</option>
                      {suppliers.map((s) => (
                        <option key={s.supplier_ID} value={s.supplier_ID}>
                          {s.supplier} ({s.supplier_ID})
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
            </li>
          ))}
        </ul>

        {isReadOnly && record.status === "rejected" && (
          <p>
            <strong>Remarks:</strong> {record.remarks}
          </p>
        )}

        {!isReadOnly && session?.user?.position === "supervisor" && (
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

        {record.status.toLowerCase() === "approved" &&
          session?.user?.department === "purchasing" && (
            <button
              className={styles.convertButton}
              onClick={handleConvertToPO}
              disabled={
                loading || items.some((item) => !item.selectedSupplierID)
              }
            >
              {loading ? "Processing..." : "Convert to PO"}
            </button>
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
