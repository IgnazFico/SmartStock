"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ScanTable from "../../../components/ScanTablePrd";
import CustomAlert from "../../../components/CustomAlert"; 
import styles from "./styles.module.css";

export default function Scan() {
  const [workerBarcode, setWorkerBarcode] = useState("");
  const [isWorkerValid, setIsWorkerValid] = useState(false);
  const [error, setError] = useState("");
  const [locator, setLocator] = useState("");
  const [isLocatorValid, setIsLocatorValid] = useState(false);
  const [scanResult, setScanResult] = useState("");
  const [scanRecordsPrd, setScanRecordsPrd] = useState([]);
  const [alertMessage, setAlertMessage] = useState("");
  const debounceTimeoutRef = useRef(null);

  const { data: session, status } = useSession();
  const loading = status === "loading";
  const router = useRouter();
  const barcodeInputRef = useRef(null);
  const locatorInputRef = useRef(null);
  const qrInputRef = useRef(null);

 useEffect(() => {
   if (status === "loading") return;

  const user = session?.user;
    if (
      !user ||
      (!["production"].includes(user.department?.toLowerCase()) &&
        !["admin", "super"].includes(user.role))
    ) {
      router.push("/unauthorized");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (barcodeInputRef.current && !loading) {
      setTimeout(() => {
        barcodeInputRef.current.focus();
      }, 100);
    }
  }, [loading, workerBarcode]);

  useEffect(() => {
    if (workerBarcode.length > 0) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = setTimeout(() => {
        validateWorkerBarcode(workerBarcode);
      }, 500);
    } else {
      setIsWorkerValid(false);
      setError("");
    }
    return () => clearTimeout(debounceTimeoutRef.current);
  }, [workerBarcode]);

  useEffect(() => {
    if (isLocatorValid && qrInputRef.current && !qrInputRef.current.disabled) {
      setTimeout(() => {
        qrInputRef.current.focus();
      }, 100);
    }
  }, [isLocatorValid]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!session) {
    router.push("/auth");
    return null;
  }

  // Validate worker barcode
  const validateWorkerBarcode = async (barcode) => {
    try {
      const response = await fetch("/api/validateWorker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerBarcode: barcode }),
      });
      const data = await response.json();
      setIsWorkerValid(data.valid);

      if (data.valid) {
        setError("");
        if (locatorInputRef.current) {
          locatorInputRef.current.focus();
        }
      } else {
        setError("Invalid worker barcode. Please enter a valid barcode.");
      }
    } catch (error) {
      setError("An error occurred during validation.");
    }
  };

  // Validate locator
  const validateLocator = async (locatorValue) => {
    try {
      const response = await fetch("/api/validateLocator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locator: locatorValue }),
      });
      const data = await response.json();
      setIsLocatorValid(data.valid);

      if (data.valid) {
        setError("");
        if (qrInputRef.current) {
          qrInputRef.current.focus();
        }
      } else {
        setError("Invalid locator. Please enter a valid locator.");
      }
    } catch (error) {
      setError("An error occurred during validation.");
    }
  };

  const handleWorkerBarcodeChange = (e) => {
    const barcode = e.target.value;
    setWorkerBarcode(barcode);
    if (barcode.length > 0) {
      validateWorkerBarcode(barcode);
    } else {
      setIsWorkerValid(false);
      setError("");
    }
  };

  const handleLocatorChange = (event) => {
    const locatorValue = event.target.value;
    setLocator(locatorValue);
    if (locatorValue.length > 0) {
      validateLocator(locatorValue);
    } else {
      setIsLocatorValid(false);
      setError("");
    }
  };

  // Handle QR scan input (format: WipID|poNumber|partNumber|quantity|uniqueId|workerBarcode)
  const handleInputChange = (event) => {
    const scannedData = event.target.value;
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      setScanResult(scannedData);

      const [WipID, poNumber, partNumber, quantity, uniqueId, workerBarcodeQR] =
        scannedData.split("|");

      if (
        WipID &&
        poNumber &&
        partNumber &&
        quantity &&
        uniqueId &&
        workerBarcodeQR
      ) {
        // ✅ cek duplicate WIP ID
        const alreadyScanned = scanRecordsPrd.some(
          (rec) => rec.wip_ID === WipID
        );
        if (alreadyScanned) {
          setAlertMessage(`WIP ID ${WipID} has already been scanned in.`); // ✅ pakai CustomAlert
          return;
        }

        setError("");           
        const newRecord = {
          id: uniqueId,
          wip_ID: WipID,
          locator,
          qty: parseInt(quantity, 10),
          part_number: partNumber,
          prod_order_id: poNumber,
          warehouse_ID: "",
          worker_barcode: workerBarcodeQR,
          time_updated: new Date().toISOString(),
        };
        setScanRecordsPrd((prevRecords) => [newRecord, ...prevRecords]);
      }

      event.target.value = "";
      if (qrInputRef.current) qrInputRef.current.value = "";
    }, 300);
  };

  // Submit records to backend (tanpa action)
  const handleSubmit = async () => {
    try {
      const response = await fetch("/api/submitRecordsPrd", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: scanRecordsPrd,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setScanRecordsPrd([]);
      setScanResult("");
      setLocator("");
      setWorkerBarcode("");
      setIsWorkerValid(false);
      setIsLocatorValid(false);
      setError(result.message || "");
      if (barcodeInputRef.current) barcodeInputRef.current.focus();
    } catch (error) {
      setError("Error submitting records.");
    }
  };

  const canPrint = () => {
    return isWorkerValid && isLocatorValid && scanRecordsPrd.length > 0;
  };

  return (
    <div
      style={{
        padding: "20px",
        borderRadius: "10px",
        boxShadow: "0 6px 14px rgba(0, 0, 0, 0.1)",
        backgroundColor: "#EDEDEDF0",
      }}
    >
      <div style={{ display: "flex", flexDirection: "row", gap: "50px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "grid" }}>
            <label
              htmlFor="barcodeInput"
              style={{
                fontSize: "18px",
                width: "89px",
                textAlign: "right",
              }}
            >
              Barcode:
            </label>
            <input
              id="barcodeInput"
              type="text"
              placeholder="Enter Barcode"
              value={workerBarcode}
              onChange={handleWorkerBarcodeChange}
              ref={barcodeInputRef}
              style={{
                width: "300px",
                padding: "10px",
                fontSize: "16px",
                marginLeft: "10px",
              }}
            />
          </div>
          <div style={{ display: "grid" }}>
            <label
              htmlFor="locatorInput"
              style={{
                fontSize: "18px",
                width: "85px",
                textAlign: "right",
              }}
            >
              Locator:
            </label>
            <input
              id="locatorInput"
              type="text"
              placeholder="Enter Locator"
              value={locator}
              onChange={handleLocatorChange}
              ref={locatorInputRef}
              style={{
                width: "300px",
                padding: "10px",
                fontSize: "16px",
                marginLeft: "10px",
              }}
              disabled={!isWorkerValid}
            />
          </div>
          <div style={{ display: "grid" }}>
            <label
              htmlFor="qrInput"
              style={{
                fontSize: "18px",
                width: "94px",
                textAlign: "right",
              }}
            >
              QR Code:
            </label>
            <input
              id="qrInput"
              type="text"
              placeholder="Scan QR Code here"
              onChange={handleInputChange}
              ref={qrInputRef}
              style={{
                width: "300px",
                padding: "10px",
                fontSize: "16px",
                marginLeft: "10px",
              }}
              disabled={!isWorkerValid || !isLocatorValid}
            />
          </div>
        </div>
        <div>
          <h2>Latest Scan Result:</h2>
          <div id="result" style={{ marginBottom: "18px" }}>
            <span className="result">{scanResult}</span>
          </div>
          <button
            onClick={handleSubmit}
            className={styles.buttonAnimate}
            disabled={!canPrint()}
          >
            Submit Records
          </button>
          {error && <p className={styles.error}>{error}</p>}
        </div>
              {/* ✅ Custom Alert modal */}
      <CustomAlert
        message={alertMessage}
        type="error"
        onClose={() => setAlertMessage("")}
      />

      <div style={{ display: "flex", flexDirection: "row", gap: "50px" }}>
        {/* input form tetap sama */}
      </div>
      </div>
      <ScanTable scanRecordsPrd={scanRecordsPrd} />
    </div>
  );
}