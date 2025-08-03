import React, { useEffect, useState, useRef } from "react";
import styles from "./PurchaseOrderDetail.module.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useSession } from "next-auth/react";

const PurchaseOrderDetailModal = ({ record, onClose }) => {
  const [supplierName, setSupplierName] = useState("");
  const [materialsList, setMaterialsList] = useState([]);
  const [poItems, setPoItems] = useState([]);
  const printRef = useRef(null);
  const { data: session } = useSession();
  const user = session?.user;

  useEffect(() => {
    if (!record) return;

    async function fetchData() {
      try {
        const supRes = await fetch("/api/supplier");
        const supData = await supRes.json();
        const supplier = supData.find(
          (s) => s.supplier_ID === record.supplier_ID
        );
        setSupplierName(supplier ? supplier.supplier : "-");

        const matRes = await fetch("/api/materials");
        const matData = await matRes.json();
        setMaterialsList(matData);

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

  const grandTotalCost = poItems.reduce((acc, item) => {
    const material = materialsList.find(
      (m) => m.material_ID === item.material_ID
    );
    const cost = material ? material.cost : 0;
    return acc + cost * item.quantity;
  }, 0);

  /** Generate PDF */
  const handleDownloadPDF = async () => {
    const element = printRef.current;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`PO_${record.po_ID}.pdf`);
  };

  /** Handle Approval */
  const handleUpdateStatus = async (newStatus) => {
    try {
      const res = await fetch("/api/po", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ po_ID: record.po_ID, status: newStatus }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Fail updated PO status");
      }

      // Update status di modal langsung
      record.status = newStatus;

      // Tutup modal dan trigger refresh tabel di parent
      if (typeof onClose === "function") onClose(true);
    } catch (err) {
      console.error("❌ Error update status:", err);
      alert("Fail updated PO status");
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={() => onClose(false)}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Area untuk print/PDF */}
        <div ref={printRef} className={styles.printArea}>
          <h2>Purchase Order Detail</h2>
          <p>
            <strong>PO ID:</strong> {record.po_ID}
          </p>
          <p>
            <strong>Order Date:</strong>{" "}
            {new Date(record.order_date).toLocaleDateString()}
          </p>
          <p>
            <strong>Supplier:</strong> {supplierName}
          </p>
          <p>
            <strong>Status:</strong> {record.status}
          </p>

          <h3>Items:</h3>
          {poItems.length === 0 && <p>No items.</p>}
          <table className={styles.printTable}>
            <thead>
              <tr>
                <th>Material</th>
                <th>Quantity</th>
                <th>Cost</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {poItems.map((item) => {
                const material = materialsList.find(
                  (m) => m.material_ID === item.material_ID
                );
                const cost = material ? material.cost : 0;
                const totalCost = cost * item.quantity;

                return (
                  <tr key={item.order_items_ID}>
                    <td>{material ? material.material : item.material_ID}</td>
                    <td>{item.quantity}</td>
                    <td>Rp {cost.toLocaleString()}</td>
                    <td>Rp {totalCost.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <h4>Grand Total: Rp {grandTotalCost.toLocaleString()}</h4>
        </div>

        {/* Action Buttons */}
        <div className={styles.modalActions}>
          {record.status === "Pending" && user?.position === "director" && (
            <>
              <button
                onClick={() => handleUpdateStatus("Ordered")}
                className={styles.approveButton}
              >
                Approve
              </button>
              <button
                onClick={() => handleUpdateStatus("Rejected")}
                className={styles.rejectButton}
              >
                Reject
              </button>
            </>
          )}
          {(record.status === "Ordered" || record.status === "Received") &&
            user?.department === "purchasing" && (
              <button
                onClick={handleDownloadPDF}
                className={styles.exportButton}
              >
                Download PDF
              </button>
            )}
          <button onClick={() => onClose(false)} className={styles.closeButton}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderDetailModal;
