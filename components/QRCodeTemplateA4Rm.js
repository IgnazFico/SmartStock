import { QRCodeCanvas } from "qrcode.react";

const QRCodeTemplateA4 = ({ qrData }) => {
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
        boxSizing: "border-box",
        pageBreakInside: "avoid",
        margin: 0,
        border: "1px solid black",
        width: "65mm",
        height: "70mm",
      }}
    >
      <div style={{ width: "100%", height: "100%" }}>
        <div
          style={{
            textAlign: "center",
            marginBottom: "5px",
            paddingTop: "15px",
          }}
        >
          <h1
            style={{
              fontSize: "14px",
              margin: "0",
              fontWeight: "800",
            }}
          >
            {rm_ID}
          </h1>
          <h2
            style={{
              fontSize: "12px",
              margin: "0",
              fontWeight: "700",
            }}
          >
            {warehouse_ID}
          </h2>
          <h3
            style={{
              fontSize: "12px",
              margin: "0",
              fontWeight: "600",
            }}
          >
            {part_number}
          </h3>
          <h4
            style={{
              fontSize: "12px",
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
            position: "relative",
            margin: "25px 0",
          }}
        >
          <div
            style={{
              width: "100px",
              height: "100px",
            }}
          >
            <QRCodeCanvas value={qrData} size={100} />
          </div>
          <p
            style={{
              fontSize: "10px",
              writingMode: "vertical-rl",
              transform: "translateY(-50%) rotate(180deg)",
              position: "absolute",
              right: "3px",
              top: "50%",
              margin: "0",
            }}
          >
            {uniqueId}
          </p>
          <p
            style={{
              fontSize: "10px",
              writingMode: "vertical-rl",
              position: "absolute",
              right: "230px",
              margin: "0",
            }}
          >
            {workerBarcode}
          </p>
        </div>
        <div
          style={{
            textAlign: "center",
            fontSize: "10px",
            margin: "10px 0",
          }}
        >
          <p>{printDate}</p>
        </div>
        <div
          style={{
            width: "100%",
            textAlign: "center",
            borderTop: "1px solid black",
            display: "flex",
            margin: "20px 0 0 0",
          }}
        >
          <p
            style={{
              fontSize: "12px",
              margin: "0px",
              borderRight: "1px solid black",
              padding: "8px",
              fontWeight: "bold",
              flex: "7",
            }}
          >
            PRINTEC WAREHOUSE
          </p>
          <p
            style={{
              fontSize: "12px",
              margin: "0px",
              padding: "8px",
              textAlign: "center",
              width: "90px",
              fontWeight: "bold",
              flex: "3",
            }}
          >
            {quantity}
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRCodeTemplateA4;