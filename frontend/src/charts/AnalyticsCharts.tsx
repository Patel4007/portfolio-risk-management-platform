import React, { useEffect, useState } from "react";
import Select from "react-select"; 
import { useLocation, useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, ResponsiveContainer
} from "recharts";

import { PieChart, Pie, Cell, Legend, Tooltip as ReTooltip } from "recharts";
import { Overview } from "../Overview";
import { Scenarios } from "../Scenarios";
import { Assistant } from "../Assistant";
import { User, LogOut } from "react-feather";
import { supabase } from "../supabaseClient";

type AnalyticsData = {
  best_day: number;
  worst_day: number;
  cumulative_returns: { date: string; value: number }[];
  drawdown_series: { date: string; drawdown: number }[];
  return_histogram: { bin: string; count: number }[];
};

const AnalyticsCharts: React.FC<{ data: AnalyticsData }> = ({ data }) => {
  const [chart, setChart] = useState<"returns" | "drawdown" | "hist">("returns");

  return (
    <>
      <div className="chip-row" style={{ marginBottom: "12px" }}>
        <div className="chip" onClick={() => setChart("returns")}>Cumulative Returns</div>
        <div className="chip" onClick={() => setChart("drawdown")}>Drawdown</div>
        <div className="chip" onClick={() => setChart("hist")}>Return Distribution</div>
      </div>

      {chart === "returns" && (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.cumulative_returns}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={v => (v * 100).toFixed(1) + "%"} />
            <Tooltip formatter={(value: number | undefined) => value !== undefined ? (value * 100).toFixed(2) + "%" : ""} />
            <Line type="monotone" dataKey="value" stroke="#8884d8" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}

      {chart === "drawdown" && (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.drawdown_series}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={v => (v * 100).toFixed(1) + "%"} />
            <Tooltip formatter={(value: number | undefined) => value !== undefined ? (value * 100).toFixed(2) + "%" : ""} />
            <Line type="monotone" dataKey="drawdown" stroke="#d88484" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}

      {chart === "hist" && (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.return_histogram}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="bin" height={60} tick={{ fontSize: 12 }} angle={-45} textAnchor="end" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </>
  );
};

export { AnalyticsCharts };