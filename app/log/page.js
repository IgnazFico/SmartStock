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

// Columns configuration for react-table including PO Number column
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
  {
    Header: "LOCATOR",
    accessor: "loc_updated",
  },
  {
    Header: "PO NUMBER",
    accessor: "po_no",
  },
  {
    Header: "PART",
    accessor: "part",
  },
  {
    Header: "QTY",
    accessor: "qty_updated",
  },
  {
    Header: "ID",
    accessor: "record_id",
  },
];


const LogMenu = () => {
  const [dateRange, setDateRange] = useState([null, null]); // State to manage date range
  const [filteredData, setFilteredData] = useState([]); // State to manage filtered data
  const [data, setData] = useState([]); // State to hold the fetched data
  const [loadingData, setLoadingData] = useState(true);

  // Fetch data from the API when the component mounts
  const fetchData = useCallback(async () => {
    try {
      const response = await fetch("/api/getLogRecords"); // Adjust the endpoint as needed
      const result = await response.json();

      setData(result);
      setFilteredData(result);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoadingData(false); // Set loading to false once data is fetched
    }
  }, []);

  // Fetch data from the API when the component mounts
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

  // Effect to filter data whenever dateRange changes
  useEffect(() => {
    filterDataByDateRange();
  }, [dateRange, filterDataByDateRange]);

  const { data: session, status } = useSession();
  const loading = status === "loading";

  if (loading) {
    return <p>Loading...</p>;
  }

  const router = useRouter();

  if (!session) {
    router.push("/auth");
    return null;
  }

  return (
    <Box
      sx={{
        padding: "20px",
        borderRadius: "10px",
        boxShadow: "0 6px 14px rgba(0, 0, 0, 0.1)",
        maxWidth: "90vw",
        height: "100%",
        backgroundColor: "#EDEDEDF0",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" }, // Responsive flex direction
          alignItems: "center",
          gap: "10px", // Add gap between elements
          marginBottom: "20px",
        }}
      >
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="From"
            value={dateRange[0]}
            onChange={(newValue) => setDateRange([newValue, dateRange[1]])}
            textField={(params) => (
              <TextField
                {...params}
                variant="outlined"
                size="small"
                sx={{ width: { xs: "100%", sm: "auto" } }} // Responsive width
              />
            )}
          />
          <DatePicker
            label="To"
            value={dateRange[1]}
            onChange={(newValue) => setDateRange([dateRange[0], newValue])}
            textField={(params) => (
              <TextField
                {...params}
                variant="outlined"
                size="small"
                sx={{ width: { xs: "100%", sm: "auto" } }} // Responsive width
              />
            )}
          />
        </LocalizationProvider>
        <button
          onClick={filterDataByDateRange}
          className={styles.buttonAnimate}
        >
          FILTER
        </button>
      </Box>

      {/* Table Component */}
      {loadingData ? (
        <p>Loading data...</p> // Show loading indicator while data is being fetched
      ) : (
        <Suspense fallback={<div>Loading table...</div>}>
          <Table columns={columns} data={filteredData} />
        </Suspense>
      )}
    </Box>
  );
};

export default LogMenu;
