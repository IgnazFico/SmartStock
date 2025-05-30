import React from "react";

export default function ScanTablePrd({ scanRecordsPrd }) {
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
              Production Order
            </th>
            <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
              Part Number
            </th>
            <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
              Quantity
            </th>
            
            <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
              Worker Barcode
            </th>
          </tr>
        </thead>
        <tbody>
          {scanRecordsPrd.map((record, index) => (
            <tr
              key={index}
              style={{
                backgroundColor: index % 2 === 0 ? "#fff" : "#f9f9f9",
              }}
            >
              
              <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                {record.prod_order_id}
              </td>
              <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                {record.part_number}
              </td>
              <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                {record.qty}
              </td>

              <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                {record.worker_barcode}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}