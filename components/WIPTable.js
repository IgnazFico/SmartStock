import React, { useState } from "react";
import styles from "./WIPTable.module.css";

const WIPInventoryTable = React.memo(({ records, handleRecordClick }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 15;

  if (!Array.isArray(records) || records.length === 0) {
    return <p>No records to display.</p>;
  }

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = records.slice(indexOfFirstRecord, indexOfLastRecord);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div>
      <table className={styles.table}>
        <thead>
          <tr className={styles.tableHeadRow}>
            <th>PRODUCTION ORDER</th>
            <th>PART NUMBER</th>
            <th>QUANTITY</th>
          
            <th>LOCATOR</th>
            <th>TIME_SUBMITTED</th>
          </tr>
        </thead>
        <tbody>
          {currentRecords.map((record, index) => (
            <tr
              key={record.wlp_ID}
              onClick={() => handleRecordClick(record)}
              style={{
                backgroundColor: index % 2 === 0 ? "#fff" : "#f9f9f9",
                cursor: "pointer",
              }}
            >
              <td>{record.prod_order_id}</td>
              <td>{record.part_number}</td>            
              <td>{record.quantity}</td>
              
              <td>{record.locator}</td>
              <td>{new Date(record.time_submitted).toLocaleString()}</td>
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

export default WIPInventoryTable;
