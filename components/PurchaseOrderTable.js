"use client";

import React, { useState } from "react";
import styles from "./PurchaseOrderTable.module.css";
import PurchaseOrderDetail from "./PurchaseOrderDetail";

const PurchaseOrderTable = ({ records = [], onAddNewPO }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const recordsPerPage = 10;

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

  const handleRowClick = (record) => {
    setSelectedRecord(record);
    setShowModal(true);
  };

  return (
    <div>
      <div className={styles.actions}>
        <input
          type="text"
          placeholder="Search PO Number, Supplier, or Material..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className={styles.searchInput}
        />
        <button className={styles.newPOButton} onClick={onAddNewPO}>
          + New PO
        </button>
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
                <th>Supplier ID</th>
                <th>Material ID</th>
                <th>Status</th>

              </tr>
            </thead>
            <tbody>
              {currentRecords.map((r, i) => (
                <tr key={i} onClick={() => handleRowClick(r)}>
                  <td>{r.po_ID}</td>
                  <td>{r.order_date}</td>
                  <td>{r.supplier_ID}</td>
                  <td>{r.material_ID}</td>
                  <td>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.container}>
            {Array.from({ length: Math.ceil(filteredRecords.length / recordsPerPage) }, (_, i) => (
              <button
                key={i}
                onClick={() => paginate(i + 1)}
                className={styles.pageButton}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </>
      )}

      {showModal && (
        <PurchaseOrderDetail
          record={selectedRecord}
          onClose={() => {
            setShowModal(false);
            setSelectedRecord(null);
          }}
        />
      )}
    </div>
  );
};

export default PurchaseOrderTable;
