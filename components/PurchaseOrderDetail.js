import React, { useEffect, useState } from "react";
import styles from "./PurchaseOrderDetail.module.css";

const PurchaseOrderDetailModal = ({ record, onClose }) => {
  const [supplierName, setSupplierName] = useState("");
  const [materialsList, setMaterialsList] = useState([]);
  const [poItems, setPoItems] = useState([]);

  useEffect(() => {
    if (!record) return;

    async function fetchData() {
      try {
        // Fetch supplier
        const supRes = await fetch("/api/supplier");
        const supData = await supRes.json();
        const supplier = supData.find((s) => s.supplier_ID === record.supplier_ID);
        setSupplierName(supplier ? supplier.supplier : "-");

        // Fetch all materials
        const matRes = await fetch("/api/materials");
        const matData = await matRes.json();
        setMaterialsList(matData);

        // Fetch PO items by po_ID
        const itemsRes = await fetch(`/api/po-items?po_ID=${record.po_ID}`);
        const itemsData = await itemsRes.json();
        setPoItems(itemsData);
      } catch (error) {
        console.error("Gagal fetch data:", error);
        setSupplierName("-");
        setMaterialsList([]);
        setPoItems([]);
      }
    }

    fetchData();
  }, [record]);

  if (!record) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2>Detail Purchase Order</h2>
        <p><strong>PO ID:</strong> {record.po_ID}</p>
        <p><strong>Order Date:</strong> {new Date(record.order_date).toLocaleDateString()}</p>
        <p><strong>Supplier:</strong> {supplierName}</p>
        <p><strong>Status:</strong> {record.status}</p>

        <h3>Items:</h3>
        {poItems.length === 0 && <p>Tidak ada item.</p>}
        <ul>
          {poItems.map((item) => {
            const material = materialsList.find(m => m.material_ID === item.material_ID);
            return (
              <li key={item.order_items_ID}>
                {material ? material.material : item.material_ID} — Quantity: {item.quantity}
              </li>
            );
          })}
        </ul>

        <div className={styles.modalActions}>
          <button onClick={onClose} className={styles.closeButton}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderDetailModal;
