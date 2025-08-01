import React, { useState, useEffect } from "react";
import styles from "./InvRawMaterialTable.module.css";

const InvRawMaterialTable = React.memo(({ records, handleRecordClick }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [records]);

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

            <th>PART_NUMBER</th>
            <th>QUANTITY</th>
            <th>LOCATOR</th>
            <th>PURCHASE ORDER</th>
            <th>TIME_SUBMITTED</th>
          </tr>
        </thead>
        <tbody>
          {currentRecords.map((record, index) => (
            <tr
              key={record._id || record.rm_ID || index}
              
              style={{
                backgroundColor: index % 2 === 0 ? "#fff" : "#f9f9f9",
                cursor: "pointer",
              }}
            >
              <td>{record.part_number}</td>
              <td>{record.quantity}</td>
              <td>{record.locator}</td>
              <td>{record.po_ID}</td>
              <td>{new Date(record.time_submitted).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
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

export default InvRawMaterialTable;