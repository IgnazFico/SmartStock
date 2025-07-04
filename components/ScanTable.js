import React from "react";

export default function ScanTable({ scanRecords }) {
  return (
    <div
      style={{
        maxHeight: "calc(78vh - 100px)",
        overflowY: "auto",
        overflowX: "auto",
        marginTop: "20px",
        border: "1px solid #ddd",
        borderRadius: "4px",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          textAlign: "left",
        }}
      >
        <thead style={{ position: "sticky", top: "0", zIndex: "1" }}>
          <tr style={{ backgroundColor: "#f2f2f2" }}>

            <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
              part_number
            </th>
            <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
              quantity
            </th>
            <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
              locator
            </th>
            <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
              time_submitted
            </th>

          </tr>
        </thead>
        <tbody>
          {scanRecords.map((record, index) => (
            <tr
              key={record._id || index}
              style={{
                backgroundColor: index % 2 === 0 ? "#fff" : "#f9f9f9",
              }}
            >
              <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                {record.part_number}
              </td>
              <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                {record.quantity}
              </td>
               <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
               {record.locator}
              </td>
              <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                {record.time_submitted}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}