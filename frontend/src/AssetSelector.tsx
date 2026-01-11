import React, { useEffect, useState } from "react";
import Select from "react-select"; 
import { useLocation, useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, ResponsiveContainer
} from "recharts";

import { PieChart, Pie, Cell, Legend, Tooltip as ReTooltip } from "recharts";
import { Overview } from "./Overview";
import { Scenarios } from "./Scenarios";
import { Assistant } from "./Assistant";
import { User, LogOut } from "react-feather";
import { supabase } from "./supabaseClient";
import "./App.css";
import {AnalyticsCharts} from "./charts/AnalyticsCharts";

const assetOptions = [
  {
    label: "Stocks",
    options: [
      { value: "AAPL", label: "Apple (AAPL)" },
      { value: "GOOG", label: "Alphabet (GOOG)" },
      { value: "TSLA", label: "Tesla (TSLA)" },
      { value: "AMZN", label: "Amazon (AMZN)" },
      { value: "VOO", label: "Vanguard S&P 500 ETF (VOO)" },
      { value: "SPY", label: "SPDR S&P 500 ETF (SPY)" },
    ],
  },
  {
    label: "Bond ETFs",
    options: [
      { value: "BND", label: "Vanguard Total Bond Market ETF (BND)" },
      { value: "AGG", label: "iShares Core U.S. Aggregate Bond ETF (AGG)" },
      { value: "TLT", label: "iShares 20+ Year Treasury Bond ETF (TLT)" },
      { value: "VTIVX", label: "Vanguard Total Intl Bond Index Fund (VTIVX)" },
      { value: "VXUS", label: "Vanguard Total Intl Stock ETF (VXUS)" },
    ],
  },
  {
    label: "Commodities",
    options: [
      { value: "GLD", label: "SPDR Gold Shares (GLD)" },
      { value: "SLV", label: "iShares Silver Trust (SLV)" },
      { value: "USO", label: "United States Oil Fund (USO)" },
      { value: "DBC", label: "Invesco DB Commodity Index ETF (DBC)" },
    ],
  },
  {
    label: "Cash / Other",
    options: [
      { value: "CASH", label: "Cash / Money Market" },
      { value: "USD", label: "U.S. Dollar (USD)" },
    ],
  },
  {
    label: "Cryptocurrencies",
    options: [
      { value: "BTC", label: "Bitcoin (BTC)" },
      { value: "ETH", label: "Ethereum (ETH)" },
      { value: "SOL", label: "Solana (SOL)" },
    ],
  },
];

const AssetSelector: React.FC<{
  portfolio: { [ticker: string]: number };
  addAsset: (ticker: string) => void;
}> = ({ portfolio, addAsset }) => {
  const [selectedOption, setSelectedOption] = useState<any>(null);

  const handleChange = (option: any) => {
    if (option && !portfolio[option.value]) {
      addAsset(option.value);
      setSelectedOption(null);
    }
  };

  const isOptionDisabled = (option: any) => portfolio.hasOwnProperty(option.value);


  const customStyles = {
  control: (provided: any, state: any) => ({
    ...provided,
   
    backgroundColor: "#141a2b", 
    borderColor: state.isFocused ? "#4285f4" : "transparent", 
    boxShadow: state.isFocused
      ? "0 0 6px 1px rgba(66, 133, 244, 0.6)" 
      : "0 1px 3px rgba(0,0,0,0.3)", 
    borderRadius: 24,
    padding: "6px 12px", 
    minHeight: 44, 
    cursor: "text",
    transition: "box-shadow 0.2s ease, border-color 0.2s ease",
  }),
  placeholder: (provided: any) => ({
    ...provided,
    color: "#7f879a",
    fontSize: 16,
    fontWeight: 400,
  }),
  singleValue: (provided: any) => ({
    ...provided,
    color: "#e5e7eb",
    fontSize: 16,
    fontWeight: 500,
  }),
  input: (provided: any) => ({
    ...provided,
    color: "#e5e7eb",
    fontSize: 16,
    margin: 0,
    padding: 0,
  }),
  menu: (provided: any) => ({
    ...provided,
    backgroundColor: "#1b2235",
    borderRadius: 12,
    marginTop: 6,
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    zIndex: 9999,
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#4285f4"
      : state.isFocused
      ? "#2a3a6b"
      : "transparent",
    color: state.isSelected ? "#fff" : "#e5e7eb",
    cursor: state.isDisabled ? "not-allowed" : "pointer",
    padding: "12px 20px",
    fontSize: 16,
  }),
  indicatorSeparator: (provided: any) => ({
    ...provided,
    backgroundColor: "transparent",
  }),
  dropdownIndicator: (provided: any, state: any) => ({
    ...provided,
    color: state.isFocused ? "#4285f4" : "#7f879a",
    padding: 4,
    cursor: "pointer",
    ":hover": {
      color: "#4285f4",
    },
  }),
  clearIndicator: (provided: any, state: any) => ({
    ...provided,
    color: state.isFocused ? "#4285f4" : "#7f879a",
    padding: 4,
    cursor: "pointer",
    ":hover": {
      color: "#4285f4",
    },
  }),
  indicatorsContainer: (provided: any) => ({
    ...provided,
    paddingRight: 8,
  }),
};

  return (
    <Select
      options={assetOptions}
      value={selectedOption}
      onChange={handleChange}
      placeholder="Search and add asset..."
      isClearable
      getOptionLabel={(e) => `${e.label}${isOptionDisabled(e) ? " (Added)" : ""}`}
      isOptionDisabled={isOptionDisabled}
      styles={customStyles}
    />
  );
};

export { assetOptions, AssetSelector };