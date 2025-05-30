"use client";

import React, { useEffect, useState } from "react";
import styles from "./PurchaseOrderDetail.module.css";

const PurchaseOrderDetailModal = ({ record, onClose }) => {
  const [supplierName, setSupplierName] = useState("");
  const [materialName, setMaterialName] = useState("");

  useEffect(() => {
    if (!record) return;

    async function fetchNames() {
      try {
        // Fetch supplier list
        const supRes = await fetch("/api/supplier");
        const supData = await supRes.json();

        // Cari supplier berdasarkan supplier_ID
        const supplier = supData.find((s) => s.supplier_ID === record.supplier_ID);
        setSupplierName(supplier ? supplier.supplier : "-");

        // Fetch material list
        const matRes = await fetch("/api/materials");
        const matData = await matRes.json();

        // Cari material berdasarkan material_ID
        const material = matData.find((m) => m.material_ID === record.material_ID);
        setMaterialName(material ? material.material : "-");
      } catch (error) {
        console.error("Gagal fetch supplier/material:", error);
        setSupplierName("-");
        setMaterialName("-");
      }
    }

    fetchNames();
  }, [record]);

  if (!record) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()} // supaya klik di modal gak menutup
      >
        <h2>Detail Purchase Order</h2>
        <p><strong>PO ID:</strong> {record.po_ID}</p>
        <p><strong>Order Date:</strong> {record.order_date}</p>
        <p><strong>Supplier ID:</strong> {record.supplier_ID}</p>
        <p><strong>Supplier:</strong> {supplierName}</p>
        <p><strong>Material ID:</strong> {record.material_ID}</p>
        <p><strong>Material:</strong> {materialName}</p>
        <p><strong>Quantity:</strong> {record.quantity}</p>
        <p><strong>Status:</strong> {record.status}</p>

        <div className={styles.modalActions}>
          <button onClick={onClose} className={styles.closeButton}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderDetailModal;
