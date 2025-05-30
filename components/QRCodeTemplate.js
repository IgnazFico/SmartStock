import React from "react";
import { QRCodeCanvas } from "qrcode.react";

const QRCodeTemplate = ({
  Inventory_ID,
  part_number,
  quantity,
  warehouse_Id,
  workerBarcode,
  time_submitted,
}) => {
  // Data QR code sesuai kebutuhan FG
  const qrCodeData = `${Inventory_ID}|${part_number}|${quantity}|${warehouse_Id}|${workerBarcode}|${time_submitted}`;
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
              fontSize: "24px",
              margin: "0",
              fontWeight: "800",
            }}
          >
            {Inventory_ID}
          </h1>
          <h3
            style={{
              fontSize: "22px",
              margin: "0",
              fontWeight: "600",
            }}
          >
            {part_number}
          </h3>
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
            <QRCodeCanvas value={qrCodeData} size={128} />
          </div>
          <p
            style={{
              fontSize: "16px",
              writingMode: "vertical-rl",
              transform: "translateY(-50%) rotate(180deg)",
              position: "absolute",
              right: "-0px",
              top: "50%",
            }}
          >
            {warehouse_Id}
          </p>
          <p
            style={{
              fontSize: "16px",
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
            fontSize: "16px",
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
              fontSize: "16px",
              margin: "0px",
              borderRight: "1px solid black",
              padding: "10px",
            }}
          >
            PRINTEC TO MATTEL
          </p>
          <p
            style={{
              fontSize: "16px",
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