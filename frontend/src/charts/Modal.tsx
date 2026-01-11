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

const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {children}
        
      </div>
    </div>
  );
};

export { Modal };