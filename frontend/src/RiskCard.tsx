import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface RiskProps {
  symbol: string;
}

type RiskData = {
  var_10d: number;
  es_10d: number;
  var_1m: number;
  var_1y: number;
  max_drawdown: number;
  sharpe: number;
  risk: string;
};

const containerStyle: React.CSSProperties = {
  maxWidth: 400,
  backgroundColor: "#1e293b",
  color: "#f1f5f9",
  borderRadius: 16,
  padding: 24,
  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  margin: "auto",
};

const titleStyle: React.CSSProperties = {
  fontSize: "1.75rem",
  fontWeight: "700",
  marginBottom: 16,
  letterSpacing: "0.05em",
};

const badgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 12px",
  borderRadius: 9999,
  backgroundColor: "#334155",
  fontWeight: "600",
  marginBottom: 20,
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
  fontSize: 14,
  marginBottom: 24,
};

const labelStyle: React.CSSProperties = {
  fontWeight: "600",
};

const riskColor = (val: number) => {
  if (val > 5) return "#ef4444"; // red
  if (val > 2) return "#facc15"; // yellow
  return "#22c55e"; // green
};

export default function RiskCard({ symbol }: RiskProps) {
  const [risk, setRisk] = useState<RiskData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/risk/${symbol}`)
      .then((r) => r.json())
      .then((data) => {
        setRisk(data);
        setLoading(false);
      });
  }, [symbol]);

  if (loading) return <div style={{ padding: 16 }}>Loading risk metrics...</div>;
  if (!risk)
    return <div style={{ padding: 16, color: "red" }}>Failed to load data.</div>;

  const chartData = [
    { name: "10d VaR", value: risk.var_10d },
    { name: "10d ES", value: risk.es_10d },
    { name: "1m VaR", value: risk.var_1m },
    { name: "1y VaR", value: risk.var_1y },
  ];

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>{symbol} Risk Summary</h2>

      <span style={badgeStyle}>Risk Level: {risk.risk.toUpperCase()}</span>

      <div style={gridStyle}>
        <div>
          <p>
            <span style={labelStyle}>10-Day VaR:</span>{" "}
            <span style={{ color: riskColor(risk.var_10d) }}>
              {risk.var_10d.toFixed(2)}%
            </span>
          </p>
          <p>
            <span style={labelStyle}>10-Day ES:</span>{" "}
            <span style={{ color: riskColor(risk.es_10d) }}>
              {risk.es_10d.toFixed(2)}%
            </span>
          </p>
          <p>
            <span style={labelStyle}>1-Month VaR:</span>{" "}
            <span style={{ color: riskColor(risk.var_1m) }}>
              {risk.var_1m.toFixed(2)}%
            </span>
          </p>
        </div>

        <div>
          <p>
            <span style={labelStyle}>1-Year VaR:</span>{" "}
            <span style={{ color: riskColor(risk.var_1y) }}>
              {risk.var_1y.toFixed(2)}%
            </span>
          </p>
          <p>
            <span style={labelStyle}>Max Drawdown:</span>{" "}
            <span style={{ color: riskColor(risk.max_drawdown) }}>
              {risk.max_drawdown.toFixed(2)}%
            </span>
          </p>
          <p>
            <span style={labelStyle}>Sharpe Ratio:</span>{" "}
            <span style={{ color: "#3b82f6" }}>{risk.sharpe.toFixed(2)}</span>
          </p>
        </div>
      </div>

      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 10, bottom: 10 }}>
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{ backgroundColor: "#334155", borderRadius: 8 }}
              labelStyle={{ color: "#cbd5e1" }}
              itemStyle={{ color: "#cbd5e1" }}
            />
            <Legend wrapperStyle={{ color: "#94a3b8" }} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#60a5fa"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Risk Metric"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p style={{ marginTop: 16, fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>
        Hover the chart for details. Use risk metrics to make informed decisions.
      </p>
    </div>
  );
}
