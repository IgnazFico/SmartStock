"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { TextField, Box } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format, endOfDay } from "date-fns";
import debounce from "lodash/debounce";
import styles from "./styles.module.css";

const Table = React.lazy(() => import("../../components/Table"));

const columns = [
  {
    Header: "Time",
    accessor: "time_updated",
    Cell: ({ value }) => {
      const date = new Date(value);
      return isNaN(date.getTime()) ? "Invalid date" : format(date, "MM/dd HH:mm");
    },
  },
  {
    Header: "First Scan",
    accessor: "timeSubmitted",
    Cell: ({ value }) => {
      const date = new Date(value);
      return isNaN(date.getTime()) ? "Invalid date" : format(date, "MM/dd HH:mm");
    },
  },
  { Header: "LOCATOR", accessor: "loc_updated" },
  { Header: "PO NUMBER", accessor: "po_no" },
  { Header: "PART", accessor: "part" },
  { Header: "QTY", accessor: "qty_updated" },
];

const LogMenu = () => {
  const [dateRange, setDateRange] = useState([null, null]);
  const [filteredData, setFilteredData] = useState([]);
  const [data, setData] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const handleExportToExcel = async () => {
    try {
      const response = await fetch("/api/exportLogsToExcel");
      if (!response.ok) throw new Error("Failed to fetch Excel file");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "log_data.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("❌ Error exporting Excel:", error);
      alert("Gagal mengekspor data. Coba lagi nanti.");
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch("/api/getLogRecords");
      let result = await response.json();

      result = result.map((row) => ({
        ...row,
        po_no: row.po_no && row.po_no.trim() !== "" ? row.po_no : "Default FG",
      }));

      setData(result);
      setFilteredData(result);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filterDataByDateRange = useCallback(
    debounce(() => {
      if (!dateRange[0] || !dateRange[1]) {
        setFilteredData(data);
      } else {
        const startDate = new Date(dateRange[0]);
        const endDate = endOfDay(new Date(dateRange[1]));
        const filtered = data.filter((row) => {
          const rowDate = new Date(row.time_updated);
          return rowDate >= startDate && rowDate <= endDate;
        });
        setFilteredData(filtered);
      }
    }, 500),
    [dateRange, data]
  );

  useEffect(() => {
    filterDataByDateRange();
  }, [dateRange, filterDataByDateRange]);

  const { data: session, status } = useSession();
  const loading = status === "loading";

  const router = useRouter();

  if (loading) return <p>Loading...</p>;
  if (!session) {
    router.push("/auth");
    return null;
  }

  return (
    <Box sx={{ padding: "20px", borderRadius: "10px", boxShadow: "0 6px 14px rgba(0, 0, 0, 0.1)", maxWidth: "90vw", backgroundColor: "#EDEDEDF0" }}>
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker label="From" value={dateRange[0]} onChange={(newValue) => setDateRange([newValue, dateRange[1]])} renderInput={(params) => <TextField {...params} size="small" />} />
          <DatePicker label="To" value={dateRange[1]} onChange={(newValue) => setDateRange([dateRange[0], newValue])} renderInput={(params) => <TextField {...params} size="small" />} />
        </LocalizationProvider>
        <button onClick={filterDataByDateRange} className={styles.buttonAnimate}>FILTER</button>
        <button onClick={handleExportToExcel} className={styles.buttonAnimate}>EXPORT TO EXCEL</button>
      </Box>

      {loadingData ? (
        <p>Loading data...</p>
      ) : (
        <Suspense fallback={<div>Loading table...</div>}>
          <Table columns={columns} data={filteredData} />
        </Suspense>
      )}
    </Box>
  );
};

export default LogMenu;
