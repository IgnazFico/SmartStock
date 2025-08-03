"use client";

import React, { useState, useEffect, useCallback } from "react";
import styles from "./PurchaseRequestTable.module.css";
import ApprovalModal from "./ApprovalModal";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const PurchaseRequestTable = ({ records = [], onAddNewPR, onRecordClick }) => {
  const recordsPerPage = 10;

  const [localRecords, setLocalRecords] = useState(records);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [approvalDetail, setApprovalDetail] = useState(null);

  useEffect(() => {
    setLocalRecords(records);
  }, [records]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredRecords = localRecords.filter((r) => {
    const matchesSearch = [r?.pr_ID, r?.users_ID].some((field) =>
      String(field || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );

    const matchesStatus = statusFilter === "All" || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const currentRecords = filteredRecords.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

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

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  /** EXPORT TO EXCEL FUNCTION WITH ITEMS */
  const exportToExcel = async () => {
    if (filteredRecords.length === 0) {
      alert("No data for export.");
      return;
    }

    try {
      // Ambil semua PR items
      const resItems = await fetch("/api/pr-items");
      if (!resItems.ok) throw new Error("Gagal mengambil PR Items");
      const allItems = await resItems.json(); // [{ pr_ID, material_ID, quantity }]

      // Gabungkan items ke masing-masing PR
      const exportData = filteredRecords.flatMap((pr) => {
        const items = allItems.filter((item) => item.pr_ID === pr.pr_ID);

        // Kalau tidak ada item, tetap export 1 row tanpa item
        if (items.length === 0) {
          return [
            {
              "PR ID": pr.pr_ID,
              "Users ID": pr.users_ID,
              Department: pr.department,
              "Request Date": pr.request_date
                ? new Date(pr.request_date).toISOString().split("T")[0]
                : "",
              Priority: pr.priority,
              Status: pr.status,
              "Material ID": "",
              Quantity: "",
            },
          ];
        }

        // Kalau ada items, buat row per item
        return items.map((item) => ({
          "PR ID": pr.pr_ID,
          "Users ID": pr.users_ID,
          Department: pr.department,
          "Request Date": pr.request_date
            ? new Date(pr.request_date).toISOString().split("T")[0]
            : "",
          Priority: pr.priority,
          Status: pr.status,
          "Material ID": item.material_ID,
          Quantity: item.quantity,
        }));
      });

      // Buat file Excel
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Purchase Requests");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, `purchase_requests_${Date.now()}.xlsx`);
    } catch (err) {
      console.error(err);
      alert("Fail export to Excel");
    }
  };

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
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Converted">Converted</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button className={styles.newPRButton} onClick={onAddNewPR}>
            + New PR
          </button>
        </div>
      </div>

      {filteredRecords.length === 0 ? (
        <p className={styles.noData}>Tidak ada data Purchase Request.</p>
      ) : (
        <>
          <div className={styles.resultsBar}>
            <div className={styles.resultsSummary}>
              {filteredRecords.length} records
            </div>
            <button onClick={exportToExcel} className={styles.exportButton}>
              Export to Excel
            </button>
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
