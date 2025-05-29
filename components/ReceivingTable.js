"use client";

import React, { useState, useEffect } from "react";
import styles from "./ReceivingTable.module.css";

const ReceivingTable = ({ records = [] }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const recordsPerPage = 10;

  // Fetch suppliers and materials once
  useEffect(() => {
    async function fetchSuppliersAndMaterials() {
      try {
        const [supRes, matRes] = await Promise.all([
          fetch("/api/supplier"),
          fetch("/api/materials"),
        ]);
        const [supData, matData] = await Promise.all([supRes.json(), matRes.json()]);

        setSuppliers(supData);
        setMaterials(matData);
      } catch (error) {
        console.error("Gagal ambil data supplier/material:", error);
      }
    }
    fetchSuppliersAndMaterials();
  }, []);

  const filteredRecords = Array.isArray(records)
    ? records.filter((r) =>
        [r.po_ID, r.supplier_ID, r.material_ID].some((field) =>
          (field ?? "").toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : [];

  const indexOfLast = currentPage * recordsPerPage;
  const indexOfFirst = indexOfLast - recordsPerPage;
  const currentRecords = filteredRecords.slice(indexOfFirst, indexOfLast);

  const paginate = (page) => setCurrentPage(page);

  const handleReceive = async () => {
    if (!selectedRecord) return;
    const updatedData = {
      po_ID: selectedRecord.po_ID,  // pastikan po_ID dikirim ke API PUT
      received_date: new Date().toISOString().split("T")[0],
      status: "Received",
    };

    try {
      const response = await fetch(`/api/receiving`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      const result = await response.json();
      alert(result.message);

      if (response.ok) {
        setSelectedRecord({ ...selectedRecord, ...updatedData });
      }
    } catch (error) {
      console.error("Gagal mengupdate data:", error);
      alert("Gagal mengupdate data.");
    }
  };

  // Helper function cari nama supplier berdasarkan ID
  const getSupplierName = (supplier_ID) => {
    const supplier = suppliers.find((s) => s.supplier_ID === supplier_ID);
    return supplier ? supplier.supplier : "-";
  };

  // Helper function cari nama material berdasarkan ID
  const getMaterialName = (material_ID) => {
    const material = materials.find((m) => m.material_ID === material_ID);
    return material ? material.material : "-";
  };

  return (
    <div>
      <div className={styles.actions}>
        <input
          type="text"
          placeholder="Search PO Number, Supplier, or Part..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className={styles.searchInput}
        />
      </div>

      {filteredRecords.length === 0 ? (
        <p>Tidak ada data Purchase Order.</p>
      ) : (
        <>
          <div className={styles.resultsSummary}>
            {filteredRecords.length} records | Total Quantity:{" "}
            {filteredRecords.reduce((sum, r) => sum + Number(r.quantity), 0)}
          </div>

          <table className={styles.table}>
            <thead>
              <tr className={styles.tableHeadRow}>
                <th>PO ID</th>
                <th>Order Date</th>
                <th>Received Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {currentRecords.map((r, i) => (
                <tr key={i} onClick={() => setSelectedRecord(r)}>
                  <td>{r.po_ID}</td>
                  <td>{r.order_date}</td>
                  <td>{r.received_date}</td>
                  <td>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.container}>
            {Array.from(
              { length: Math.ceil(filteredRecords.length / recordsPerPage) },
              (_, i) => (
                <button
                  key={i}
                  onClick={() => paginate(i + 1)}
                  className={styles.pageButton}
                >
                  {i + 1}
                </button>
              )
            )}
          </div>
        </>
      )}

      {selectedRecord && (
        <div className={styles.modalOverlay} onClick={() => setSelectedRecord(null)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Detail PO: {selectedRecord.po_ID}</h3>
            <p>Order Date: {selectedRecord.order_date}</p>
            <p>Supplier ID: {selectedRecord.supplier_ID}</p>
            <p>Supplier: {getSupplierName(selectedRecord.supplier_ID)}</p>
            <p>Material ID: {selectedRecord.material_ID}</p>
            <p>Material: {getMaterialName(selectedRecord.material_ID)}</p>
            <p>Quantity: {selectedRecord.quantity}</p>
            <p>Status: {selectedRecord.status}</p>
            <p>Received Date: {selectedRecord.received_date}</p>

            {selectedRecord.status !== "Received" && (
              <button onClick={handleReceive} className={styles.receiveButton}>
                Receive
              </button>
            )}

            <button
              onClick={() => setSelectedRecord(null)}
              className={styles.closeButton}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceivingTable;
