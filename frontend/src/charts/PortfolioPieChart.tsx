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


const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#00C49F", "#0088FE"];

const PortfolioPieChart: React.FC<{ portfolio: { [ticker: string]: number } }> = ({ portfolio }) => {
  const data = Object.entries(portfolio).map(([ticker, weight]) => ({
    name: ticker,
    value: weight
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Legend />
        <ReTooltip formatter={(value: number | undefined) => value !== undefined ? value.toFixed(2) : ""} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export { PortfolioPieChart };