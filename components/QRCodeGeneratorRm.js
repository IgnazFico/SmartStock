"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { debounce } from "lodash";
import Select from "react-select";
import ReactDOM from "react-dom";
import QRCodeTemplate from "./QRCodeTemplateRm";
import QRCodeTemplateA4 from "./QRCodeTemplateA4Rm";
import { createRoot } from "react-dom/client";
import styles from "./QRCodeGeneratorRm.module.css";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

  const QRCodeGenerator = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [workerBarcode, setWorkerBarcode] = useState("");
  const [isWorkerValid, setIsWorkerValid] = useState(false);
  const [rm_ID, setrm_ID] = useState("");
  const [warehouse_ID] = useState("wh_rm");   
  const [part_number, setpart_number] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [po_ID, setpo_ID] = useState("");
  const [copy, setCopy] = useState(1);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(true);
  const [poOptions, setPoOptions] = useState([]);

  // ⛔ Blokir user yang tidak berasal dari Logistics atau tidak admin/super
  useEffect(() => {
    if (status === "loading") return;

    const user = session?.user;
    if (!user || !["logistics"].includes(user.department?.toLowerCase()) &&
      !["admin", "super"].includes(user.role)) {
      router.push("/unauthorized");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (isWorkerValid) {
      fetch("/api/generateRmId")
        .then((res) => res.json())
        .then((data) => setrm_ID(data.rmId))
        .catch(() => setrm_ID(""));
    } else {
      setrm_ID("");
    }
  }, [isWorkerValid]);

  useEffect(() => {
    if (isWorkerValid) {
      fetch("/api/barcode/available-pos")
        .then((res) => res.json())
        .then((data) => setPoOptions(data))
        .catch(() => setPoOptions([]));
    }
  }, [isWorkerValid]);

  const poOptionsMapped = poOptions.map((po) => ({
    value: po.po_ID,
    label: po.po_ID,
    material_ID: po.material_ID,
    quantity: po.quantity,
  }));

  const validateWorkerBarcode = useCallback(
    debounce(async (barcode) => {
      try {
        const response = await fetch("/api/validateWorker", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workerBarcode: barcode }),
        });
        const data = await response.json();
        setIsWorkerValid(data.valid);
        setError(data.valid ? "" : "Invalid worker barcode. Please enter a valid barcode.");
      } catch {
        setError("An error occurred during validation.");
      }
    }, 300),
    []
  );

  const handleWorkerBarcodeChange = (e) => {
    const barcode = e.target.value;
    setWorkerBarcode(barcode);
    if (barcode.length > 0) validateWorkerBarcode(barcode);
    else {
      setIsWorkerValid(false);
      setError("");
    }
  };

  const generateUniqueId = () => {
    return `${Date.now()}${Math.floor(Math.random() * 10000)}`;
  };

  const fetchSuggestions = useCallback(
    debounce(async (inputValue) => {
      try {
        const res = await fetch(`/api/items?partNumber=${encodeURIComponent(inputValue)}`);
        const data = await res.json();
        setSuggestions(data);
        setIsSuggestionsVisible(true);
      } catch {}
    }, 500),
    []
  );

  const handlepart_numberChange = (e) => {
    const inputValue = e.target.value;
    setpart_number(inputValue);
    if (inputValue.length > 2) fetchSuggestions(inputValue);
    else setSuggestions([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") setActiveSuggestionIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    else if (e.key === "ArrowUp") setActiveSuggestionIndex((prev) => Math.max(prev - 1, 0));
    else if (e.key === "Enter" && activeSuggestionIndex >= 0) selectSuggestion(activeSuggestionIndex);
  };

  const selectSuggestion = (index) => {
    const selected = suggestions[index];
    setpart_number(selected.part_number);
    setIsSuggestionsVisible(false);
    setActiveSuggestionIndex(-1);
  };

  const highlightMatch = (text, match) => {
    if (!text || !match) return text;
    const regex = new RegExp(`(${match})`, "i");
    return text.split(regex).map((part, i) =>
      regex.test(part) ? <span key={i} className={styles.match}>{part}</span> : part
    );
  };

  const validateInputs = () => {
    if (isNaN(quantity) || quantity <= 0) return setError("Quantity must be a positive number."), false;
    if (isNaN(copy) || copy <= 0) return setError("Copy must be a positive number."), false;
    setError("");
    return true;
  };

  const canPrint = () => {
    return isWorkerValid && rm_ID && warehouse_ID && part_number && po_ID && quantity > 0 && copy > 0;
  };

  const trackUsedPO = async () => {
    try {
      await fetch("/api/barcode/track-used", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ po_ID, type: "raw_material", used_at: new Date() }),
      });
      const res = await fetch("/api/barcode/available-pos");
      const data = await res.json();
      setPoOptions(data);
      setpo_ID("");
      setpart_number("");
      setQuantity(1);
    } catch (err) {
      console.error("❌ Gagal track PO:", err);
    }
  };

  const handlePrint = () => {
    if (!validateInputs()) return;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Print</title><style>html, body { width: 80mm; height: 80mm; margin: 0; font-family: Arial; } #print-root { width: 100%; height: 100%; }</style></head><body><div id='print-root'></div></body></html>`);
    printWindow.document.close();

    const printRoot = printWindow.document.getElementById("print-root");
    const root = createRoot(printRoot);

    const templates = Array.from({ length: copy }, (_, i) => (
      <QRCodeTemplate
        key={i}
        qrData={[rm_ID, warehouse_ID, part_number, quantity, po_ID, generateUniqueId(), workerBarcode].join("|")}
      />
    ));

    root.render(<>{templates}</>);
    printWindow.focus();
    printWindow.print();
    trackUsedPO();
  };

  const handlePrintA4 = () => {
    if (!validateInputs()) return;
    const printWindow = window.open("", "_blank");
    const templates = Array.from({ length: copy }, (_, i) => (
      <QRCodeTemplateA4
        key={i}
        qrData={[rm_ID, warehouse_ID, part_number, quantity, po_ID, generateUniqueId(), workerBarcode].join("|")}
      />
    ));

    const htmlContent = `<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Print A4</title><style>@page { size: A4 landscape; margin: 1mm; } body { width: 210mm; height: 297mm; margin: 0; font-family: Arial; } #print-root { display: grid; grid-template-columns: repeat(6, 1fr); grid-template-rows: repeat(4, 1fr); gap: 1mm; }</style></head><body><div id='print-root'></div></body></html>`;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    printWindow.onload = () => {
      const mountNode = printWindow.document.getElementById("print-root");
      ReactDOM.render(<>{templates}</>, mountNode);
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        trackUsedPO();
      }, 500);
    };
  };

  return (
    <div className={styles.container}>
      <div className={styles.formGroup}>
        <label className={styles.label}>Worker Barcode:</label>
        <input type="text" value={workerBarcode} onChange={handleWorkerBarcodeChange} className={styles.input} />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.label}>RM ID:</label>
        <input type="text" value={rm_ID} className={styles.input} readOnly disabled />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.label}>Part Number:</label>
        <input type="text" value={part_number} onChange={handlepart_numberChange} onKeyDown={handleKeyDown} className={styles.input} disabled />
        {suggestions.length > 0 && isSuggestionsVisible && (
          <ul className={styles.suggestionsList} role="listbox">
            {suggestions.map((item, index) => (
              <li
                key={index}
                role="option"
                aria-selected={index === activeSuggestionIndex}
                className={`${styles.suggestionItem} ${index === activeSuggestionIndex ? styles.active : ""}`}
                onClick={() => selectSuggestion(index)}
              >
                {highlightMatch(item.part_number || "Not Found", part_number || "")}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className={styles.formGroup}>
        <label className={styles.label}>Quantity:</label>
        <input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} min="1" className={styles.input} disabled />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.label}>Purchase Order:</label>
        <Select
          options={poOptionsMapped}
          placeholder="SELECT PO ID"
          isDisabled={!isWorkerValid}
          value={poOptionsMapped.find((opt) => opt.value === po_ID)}
          onChange={(selected) => {
            if (selected) {
              setpo_ID(selected.value);
              setpart_number(selected.material_ID || "");
              setQuantity(Number(selected.quantity) || 1);
            }
          }}
        />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.label}>Copy:</label>
        <input type="number" value={copy} onChange={(e) => setCopy(Number(e.target.value))} min="1" className={styles.input} disabled={!isWorkerValid} />
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.buttonGroup}>
        <button onClick={handlePrint} className={styles.button} disabled={!canPrint()}>Print QR Codes</button>
        <button onClick={handlePrintA4} className={styles.button} disabled={!canPrint()}>Print on A4</button>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
