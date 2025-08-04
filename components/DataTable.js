import React from "react";
import styles from "./DataTable.module.css";


const DataTable = ({ data, columns }) => {
  // Support both array of strings and array of {key, label}
  const isObjectColumns = columns.length && typeof columns[0] === "object" && columns[0] !== null;
  return (
    <div className={styles.tableContainer}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={isObjectColumns ? col.key : col}>
                {isObjectColumns ? col.label : col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              {columns.map((col) => (
                <td key={isObjectColumns ? col.key : col}>
                  {row[isObjectColumns ? col.key : col]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
