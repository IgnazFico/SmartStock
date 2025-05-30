import React, { useState } from "react";
import styles from "./InvTable.module.css";

const InvTable = React.memo(({ records, handleRecordClick }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 15;

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = records.slice(indexOfFirstRecord, indexOfLastRecord);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (!records || records.length === 0) {
    return <p>No records to display.</p>;
  }

  return (
    <div>
      <table className={styles.table}>
        <thead>
          <tr className={styles.tableHeadRow}>
            <th>Inventory ID</th>
            <th>Part Number</th>
            <th>Quantity</th>
            <th>Locator</th>
            <th>Warehouse</th>
            <th>Time Submitted</th>
          </tr>
        </thead>
        <tbody>
          {currentRecords.map((record, index) => (
            <tr
              key={index}
              onClick={() => handleRecordClick(record)}
              style={{
                backgroundColor: index % 2 === 0 ? "#fff" : "#f9f9f9",
                cursor: "pointer",
              }}
            >
              <td>{record.Inventory_ID}</td>
              <td>{record.part_number}</td>
              <td>{record.quantity}</td>
              <td>{record.locator}</td>
              <td>{record.warehouse_Id}</td>
              <td>{record.time_submitted}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination controls */}
      <div className={styles.container}>
        {Array.from(
          { length: Math.ceil(records.length / recordsPerPage) },
          (_, i) => (
            <button
              key={i + 1}
              onClick={() => paginate(i + 1)}
              style={{
                margin: "0 5px",
                padding: "5px 10px",
                backgroundColor: currentPage === i + 1 ? "#074d6f" : "#09587f",
                color: "#fff",
                border: "none",
                borderRadius: "2px",
                cursor: "pointer",
              }}
            >
              {i + 1}
            </button>
          )
        )}
      </div>
    </div>
  );
});

export default InvTable;