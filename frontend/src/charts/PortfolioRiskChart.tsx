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
import {AnalyticsCharts} from "./AnalyticsCharts";

type RiskPoint = {
  date: string;
  risk: number;
};


const PortfolioRiskChart: React.FC<{ data: RiskPoint[] }> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={v => (v * 100).toFixed(1) + "%"} />
        <Tooltip
          formatter={(value: number | undefined) =>
            value !== undefined ? (value * 100).toFixed(2) + "%" : ""
          }
        />
        <Line
          type="monotone"
          dataKey="risk"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export { PortfolioRiskChart };