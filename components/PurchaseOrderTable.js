"use client";

import React, { useState } from "react";
import DataModal from "@/components/DataModal";
import styles from "./PurchaseOrderTable.module.css";
import PurchaseOrderDetail from "./PurchaseOrderDetail";
import { useSession } from "next-auth/react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const PurchaseOrderTable = ({ records = [], onAddNewPO }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const recordsPerPage = 10;
  const { data: session } = useSession();
  const [isSupplierModalOpen, setSupplierModalOpen] = useState(false);
  const [supplierLoading, setSupplierLoading] = useState(false);
  const [supplierError, setSupplierError] = useState(null);
  // Add new supplier
  const handleAddSupplier = async (formData) => {
    setSupplierLoading(true);
    setSupplierError(null);
    try {
      const res = await fetch("/api/insertSupplier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to insert supplier");
      setSupplierModalOpen(false);
      alert("Supplier added!");
    } catch (err) {
      setSupplierError(err.message);
    } finally {
      setSupplierLoading(false);
    }
  };

  /** Filter by PO ID or Supplier ID */
  const filteredRecords = Array.isArray(records)
    ? records.filter((r) => {
        const matchesSearch = [r.po_ID, r.supplier_ID].some((field) =>
          (field ?? "").toLowerCase().includes(searchTerm.toLowerCase())
        );
        const matchesStatus =
          statusFilter === "All" || r.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
    : [];

  /** Pagination logic */
  const indexOfLast = currentPage * recordsPerPage;
  const indexOfFirst = indexOfLast - recordsPerPage;
  const currentRecords = filteredRecords.slice(indexOfFirst, indexOfLast);

  const paginate = (page) => setCurrentPage(page);

  /** Open detail modal */
  const handleRowClick = (record) => {
    setSelectedRecord(record);
    setShowModal(true);
  };

  /** Export to Excel */
  const exportToExcel = async () => {
    if (filteredRecords.length === 0) {
      alert("No data for export");
      return;
    }

    try {
      const itemsRes = await fetch("/api/po-items");
      if (!itemsRes.ok) throw new Error("Gagal ambil PO Items");
      const allItems = await itemsRes.json();

      const exportData = [];
      for (const po of filteredRecords) {
        const relatedItems = allItems.filter((item) => item.po_ID === po.po_ID);

        if (relatedItems.length > 0) {
          relatedItems.forEach((item) => {
            exportData.push({
              "PO ID": po.po_ID,
              "Order Date": po.order_date
                ? new Date(po.order_date).toISOString().split("T")[0]
                : "",
              "Supplier ID": po.supplier_ID,
              Status: po.status,
              "Material ID": item.material_ID,
              Quantity: item.quantity,
            });
          });
        } else {
          exportData.push({
            "PO ID": po.po_ID,
            "Order Date": po.order_date
              ? new Date(po.order_date).toISOString().split("T")[0]
              : "",
            "Supplier ID": po.supplier_ID,
            Status: po.status,
            "Material ID": "-",
            Quantity: 0,
          });
        }
      }

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Purchase Orders");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, `purchase_orders_${Date.now()}.xlsx`);
    } catch (error) {
      console.error("Export to Excel gagal:", error);
      alert("Fail export data PO");
    }
  };

  /** Cancel PO */
  const handleCancel = async (po_ID) => {
    const confirmCancel = window.confirm("Sure you want to cancel this PO?");
    if (!confirmCancel) return;

    try {
      const res = await fetch("/api/po", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ po_ID, status: "Cancelled" }),
      });

      if (!res.ok) throw new Error("Fail Cancelling PO");

      alert("PO berhasil dibatalkan");
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Error occurred when cancelling PO");
    }
  };

  return (
    <div>
      {/* Action bar */}
      <div className={styles.actions}>
        <div className={styles.searchAndFilterGroup}>
          <input
            type="text"
            placeholder="Search PO Number or Supplier..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className={styles.searchInput}
          />
          <select
            className={styles.statusFilter}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Ordered">Ordered</option>
            <option value="Rejected">Rejected</option>
            <option value="Received">Received</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          {(session?.user?.department === "purchasing" ||
            session?.user?.role === "admin") && (
            <div>
              <button className={styles.newPOButton} onClick={onAddNewPO}>
                + New PO
              </button>
              <button
                className={styles.newPOButton}
                onClick={() => setSupplierModalOpen(true)}
              >
                Add Supplier
              </button>

              <DataModal
                isOpen={isSupplierModalOpen}
                onClose={() => setSupplierModalOpen(false)}
                onSubmit={handleAddSupplier}
                fields={["supplier_ID", "supplier", "phone", "address"]}
                loading={supplierLoading}
                error={supplierError}
                title="Add New Supplier"
              />
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      {filteredRecords.length === 0 ? (
        <p>Tidak ada data Purchase Order.</p>
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
            <thead>
              <tr className={styles.tableHeadRow}>
                <th>PO ID</th>
                <th>Order Date</th>
                <th>Supplier ID</th>
                <th>Status</th>
                {(session?.user?.department === "purchasing" ||
                  session?.user?.role === "admin") && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {currentRecords.map((r, i) => (
                <tr key={i} style={{ cursor: "pointer" }}>
                  {/* Klik cell selain tombol Cancel buka modal detail */}
                  <td onClick={() => handleRowClick(r)}>{r.po_ID}</td>
                  <td onClick={() => handleRowClick(r)}>
                    {r.order_date
                      ? new Date(r.order_date).toISOString().split("T")[0]
                      : ""}
                  </td>
                  <td onClick={() => handleRowClick(r)}>{r.supplier_ID}</td>
                  <td onClick={() => handleRowClick(r)}>{r.status}</td>

                  {(session?.user?.department === "purchasing" ||
                    session?.user?.role === "admin") && (
                    <td>
                      {r.status === "Ordered" && (
                        <button
                          className={styles.cancelButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancel(r.po_ID);
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
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

      {/* Detail modal */}
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
