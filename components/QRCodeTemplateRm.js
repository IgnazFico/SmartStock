import React from "react";
import { QRCodeCanvas } from "qrcode.react";

const QRCodeTemplate = ({ qrData }) => {
  // Format QR: rm_ID|warehouse_ID|part_number|quantity|po_ID|uniqueId|workerBarcode
  const [
    rm_ID = "",
    warehouse_ID = "",
    part_number = "",
    quantity = "",
    po_ID = "",
    uniqueId = "",
    workerBarcode = ""
  ] = qrData.split("|");
  const printDate = new Date().toLocaleDateString("en-GB");

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        pageBreakAfter: "always",
        margin: 0,
        border: "1px solid black",
      }}
    >
      <div style={{ width: "100%", height: "100%" }}>
        <div
          style={{
            textAlign: "center",
            marginBottom: "5px",
          }}
        >
          <h1
            style={{
              fontSize: "22px",
              margin: "0",
              fontWeight: "800",
            }}
          >
            {rm_ID}
          </h1>
          <h2
            style={{
              fontSize: "20px",
              margin: "0",
              fontWeight: "700",
            }}
          >
            {warehouse_ID}
          </h2>
          <h3
            style={{
              fontSize: "18px",
              margin: "0",
              fontWeight: "600",
            }}
          >
            {part_number}
          </h3>
          <h4
            style={{
              fontSize: "16px",
              margin: "0",
              fontWeight: "600",
            }}
          >
            {po_ID}
          </h4>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            height: "50%",
            position: "relative",
            margin: "5px 0",
          }}
        >
          <div
            style={{
              width: "128px",
              height: "128px",
            }}
          >
            {/* Dynamically generated QR Code */}
            <QRCodeCanvas value={qrData} size={128} />
          </div>
          <p
            style={{
              fontSize: "14px",
              writingMode: "vertical-rl",
              transform: "translateY(-50%) rotate(180deg)",
              position: "absolute",
              right: "-0px",
              top: "50%",
            }}
          >
            {uniqueId}
          </p>
          <p
            style={{
              fontSize: "14px",
              writingMode: "vertical-rl",
              position: "absolute",
              right: "251px",
            }}
          >
            {workerBarcode}
          </p>
        </div>
        <div
          style={{
            textAlign: "center",
            fontSize: "14px",
          }}
        >
          <p>{printDate}</p>
        </div>
        <div
          style={{
            width: "100%",
            marginTop: "-2px",
            textAlign: "center",
            borderTop: "1px solid black",
            display: "flex",
          }}
        >
  <p
            style={{
              fontSize: "12px",
              fontFamily: "Courier New, monospace",
              margin: "0px",
              borderRight: "1px solid black",
              padding: "20px",
            }}
          >
            PRINTEC WAREHOUSE
          </p>
          <p
            style={{
              fontSize: "14px",
              margin: "0px",
              padding: "10px",
              textAlign: "center",
              width: "90px",
            }}
          >
            {quantity}
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRCodeTemplate;