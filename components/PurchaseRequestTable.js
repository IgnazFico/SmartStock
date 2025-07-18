"use client";

import React, { useState, useEffect, useCallback } from "react";
import styles from "./PurchaseRequestTable.module.css";
import ApprovalModal from "./ApprovalModal";

const PurchaseRequestTable = ({ records = [], onAddNewPR, onRecordClick }) => {
  const recordsPerPage = 10;

  // Local state
  const [localRecords, setLocalRecords] = useState(records);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [approvalDetail, setApprovalDetail] = useState(null);

  // Sync props records to local state
  useEffect(() => {
    setLocalRecords(records);
  }, [records]);

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Filter records based on pr_ID or users_ID containing searchTerm
  const filteredRecords = localRecords.filter((r) => {
    const matchesSearch = [r?.pr_ID, r?.users_ID].some((field) =>
      String(field || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );

    const matchesStatus = statusFilter === "All" || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Slice records for current page
  const currentRecords = filteredRecords.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  // Fetch PR data to refresh list
  const fetchPRs = useCallback(async () => {
    try {
      const res = await fetch("/api/pr");
      if (!res.ok) throw new Error("Failed to fetch Purchase Requests");
      const data = await res.json();
      setLocalRecords(data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  // When user clicks a row
  const handleRowClick = async (record) => {
    setSelectedRecord(record);

    if (record.status === "Approved" || record.status === "Rejected") {
      try {
        const res = await fetch(`/api/approval/detail?pr_ID=${record.pr_ID}`);
        if (!res.ok) throw new Error("Failed to fetch approval detail");
        const detail = await res.json();
        setApprovalDetail(detail);
      } catch (error) {
        console.error(error);
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

  // Pagination buttons handler
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div>
      <div className={styles.actions}>
        <div className={styles.searchAndFilterGroup}>
          <input
            type="text"
            placeholder="Search PR ID or User ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
            aria-label="Search Purchase Requests"
          />

          <select
            className={styles.statusFilter}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="All">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="converted">Converted</option>
          </select>
        </div>

        <button className={styles.newPRButton} onClick={onAddNewPR}>
          + New PR
        </button>
      </div>

      {filteredRecords.length === 0 ? (
        <p className={styles.noData}>Tidak ada data Purchase Request.</p>
      ) : (
        <>
          <div className={styles.resultsSummary}>
            {filteredRecords.length} records{" "}
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
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleRowClick(r);
                    }
                  }}
                  aria-label={`Purchase Request ${r.pr_ID}, status: ${r.status}`}
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
                  className={`${styles.pageButton} ${
                    currentPage === i + 1 ? styles.activePage : ""
                  }`}
                  aria-current={currentPage === i + 1 ? "page" : undefined}
                  aria-label={`Go to page ${i + 1}`}
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
