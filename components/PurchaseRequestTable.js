"use client";

import React, { useState, useEffect } from "react";
import styles from "./PurchaseRequestTable.module.css";
import ApprovalModal from "./ApprovalModal"; 

const PurchaseRequestTable = ({ records = [], onAddNewPR, onRecordClick }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [approvalDetail, setApprovalDetail] = useState(null);
  const recordsPerPage = 10;
  const [localRecords, setLocalRecords] = useState(records);

  useEffect(() => {
    setLocalRecords(records);
  }, [records]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredRecords = (localRecords ?? []).filter((r) =>
    [r?.pr_ID, r?.users_ID].some((field) =>
      String(field || "").toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const currentRecords = filteredRecords.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  const fetchPRs = async () => {
    try {
      const res = await fetch("/api/pr");
      if (!res.ok) throw new Error("Gagal mengambil data PR");
      const data = await res.json();
      setLocalRecords(data);
    } catch (error) {
      console.error("Error fetching PR data:", error);
    }
  };

  const handleRowClick = async (record) => {
    setSelectedRecord(record);

    if (record.status === "Approved" || record.status === "Rejected") {
      try {
        const res = await fetch(`/api/approval/detail?pr_ID=${record.pr_ID}`);
        if (!res.ok) throw new Error("Gagal mengambil detail approval");
        const detail = await res.json();
        setApprovalDetail(detail);
      } catch (err) {
        console.error("Failed to fetch approval detail", err);
        setApprovalDetail(null);
      }
    } else {
      setApprovalDetail(null);
    }

    setShowModal(true);

    if (typeof onRecordClick === "function") {
      onRecordClick(record);
    }
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div>
      <div className={styles.actions}>
        <input
          placeholder="Search PR ID or User ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <button className={styles.newPRButton} onClick={onAddNewPR}>
          + New PR
        </button>
      </div>

      {filteredRecords.length === 0 ? (
        <p>Tidak ada data Purchase Request.</p>
      ) : (
        <>
          <div className={styles.resultsSummary}>
            {filteredRecords.length} records | Total Quantity:{" "}
            {filteredRecords.reduce(
              (sum, r) => sum + Number(r.quantity || 0),
              0
            )}
          </div>

          <table className={styles.table}>
            <thead className={styles.tableHeadRow}>
              <tr>
                <th>PR ID</th>
                <th>Users ID</th>
                <th>Department</th>
                <th>Request Date</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {currentRecords.map((r, i) => (
                <tr
                  key={r.pr_ID || i}
                  onClick={() => handleRowClick(r)}
                  className={styles.tableRow}
                  style={{ cursor: "pointer" }}
                >
                  <td>{r.pr_ID}</td>
                  <td>{r.users_ID}</td>
                  <td>{r.department}</td>
                  <td>
                    {r.request_date
                      ? new Date(r.request_date).toISOString().split("T")[0]
                      : ""}
                  </td>
                  <td>{r.priority}</td>
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

      {showModal && selectedRecord && (
        <ApprovalModal
          record={selectedRecord}
          detail={approvalDetail}
          onClose={() => {
            setSelectedRecord(null);
            setApprovalDetail(null);
            setShowModal(false);
          }}
          refreshData={fetchPRs}
        />
      )}
    </div>
  );
};

export default PurchaseRequestTable;
