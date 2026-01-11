import React, { useState, useRef, useEffect } from "react";
import { TrendingUp, TrendingDown, DollarSign, Activity, AlertTriangle, Shield } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { normalizeTicker } from "./App";

type RiskResponse = {
  var: number;
  es: number;
  sharpe: number;
  max_drawdown: number;
  volatility?: number;
  beta?: number;
};

type OverviewProps = {
  riskData: {
    portfolio: RiskResponse;
  } | null;
  tickers: string[];
  weights: number[];
  portfolio: { [ticker: string]: number };
  portfolioValue: number;
  assetCategoryMap: Record<string, string>;
};

function generateGBMProjection(
  S0: number, 
  mu: number, 
  sigma: number, 
  days: number,
  simulations: number = 1000
) {
  const dt = 1; 
  const projections: number[][] = [];

  for (let s = 0; s < simulations; s++) {
    const path: number[] = [S0];
    for (let i = 1; i <= days; i++) {
      const prev = path[i - 1];
      const drift = (mu - 0.5 * sigma ** 2) * dt;
      const shock = sigma * Math.sqrt(dt) * randomNormal();
      const next = prev * Math.exp(drift + shock);
      path.push(next);
    }
    projections.push(path);
  }

  const median: number[] = [];
  const p10: number[] = [];
  const p90: number[] = [];

  for (let day = 0; day <= days; day++) {
    const dayValues = projections.map((sim) => sim[day]).sort((a, b) => a - b);
    median.push(dayValues[Math.floor(0.5 * simulations)]);
    p10.push(dayValues[Math.floor(0.1 * simulations)]);
    p90.push(dayValues[Math.floor(0.9 * simulations)]);
  }

  return { median, p10, p90 };
}

// Simple Box-Muller transform for standard normal random numbers
function randomNormal() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random(); 
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}


export function Overview({ riskData, tickers, weights, portfolio, portfolioValue, assetCategoryMap }: OverviewProps) {
  
  const safeAssetCategoryMap = assetCategoryMap ?? {};
  
  const CATEGORY_COLORS: Record<string, string> = {
  Stocks: "#8b5cf6",
  "Bond ETFs": "#10b981",
  Commodities: "#f59e0b",
  "Cash / Other": "#ef4444",
  Cryptocurrencies: "#3b82f6",
};

const allocationData = Object.entries(portfolio ?? {}).reduce<
  { name: string; value: number; color: string }[]
>((acc, [ticker, weight]) => {
  const category = safeAssetCategoryMap[normalizeTicker(ticker)] ?? "Other";

  const existing = acc.find(a => a.name === category);

  if (existing) {
    existing.value += weight;
  } else {
    acc.push({
      name: category,
      value: weight,
      color: CATEGORY_COLORS[category] ?? "#9ca3af",
    });
  }

  return acc;
}, []);



  type RiskMetricItem = {
    label: string;
    value: string;
    trend: "up" | "down";
    icon: React.ElementType;
  };

  const riskMetrics: RiskMetricItem[] = riskData?.portfolio
    ? [
        {
          label: "Portfolio Beta",
          value: riskData.portfolio.beta?.toFixed(2) ?? "—",
          trend: (riskData.portfolio.beta ?? 1) > 1 ? "up" : "down",
          icon: Activity,
        },
        {
          label: "Volatility",
          value: riskData.portfolio.volatility
            ? `${(riskData.portfolio.volatility * 100).toFixed(1)}%`
            : "—",
          trend: "down",
          icon: AlertTriangle,
        },
        {
          label: "Sharpe Ratio",
          value: riskData.portfolio.sharpe.toFixed(2),
          trend: "up",
          icon: Shield,
        },
        {
          label: "Max Drawdown",
          value: `${(riskData.portfolio.max_drawdown * 100).toFixed(1)}%`,
          trend: "down",
          icon: TrendingDown,
        },
      ]
    : [];





  

  const prevPortfolioValueRef = useRef<number | null>(null);

  const [dailyChange, setDailyChange] = useState(0);
  const [dailyChangePercent, setDailyChangePercent] = useState(0);

  const [portfolioProjection, setPortfolioProjection] = useState<{
  median: number[];
  p10: number[];
  p90: number[];
}>({ median: [], p10: [], p90: [] });


useEffect(() => {
  if (prevPortfolioValueRef.current !== null) {
    const change = portfolioValue - prevPortfolioValueRef.current;
    setDailyChange(change);
    setDailyChangePercent(change / prevPortfolioValueRef.current);
  }
  prevPortfolioValueRef.current = portfolioValue;
}, [portfolioValue]);
  

  useEffect(() => {
  fetch("http://localhost:8000/risk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tickers,
      weights,
      portfolio_value: portfolioValue
    })
  })
    .then(res => res.json())
    .then(data => {
      const changePercent = data.today_change.change_pct; 
      const backendChange = portfolioValue * (changePercent / 100);
      setDailyChange(backendChange);     
      setDailyChangePercent(changePercent); 
    });
}, [portfolioValue]);

useEffect(() => {
  if (portfolioValue > 0 && riskData?.portfolio?.volatility) {
    const days = 30;
    const mu = 0.0005; // expected daily return ~0.05%
    const sigma = riskData.portfolio.volatility; // daily volatility
    const projection = generateGBMProjection(portfolioValue, mu, sigma, days, 1000);
    setPortfolioProjection(projection);
  }
}, [portfolioValue, riskData]);

const projectionData = portfolioProjection.median.map((value, i) => ({
  day: i + 1,
  baseline: value,
  p10: portfolioProjection.p10[i],
  p90: portfolioProjection.p90[i],
}));





  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-medium text-gray-100 mb-2">Portfolio Overview</h1>
        <p className="text-gray-400">Monitor your portfolio performance and risk metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1a1f2e] rounded-lg p-6 border border-gray-800 shadow-sm">
  
  <div className="flex items-center justify-between mb-4">
    <p className="text-gray-400 text-sm font-medium">Total Portfolio Value</p>
    <DollarSign className="w-5 h-5 text-gray-500" />
  </div>

  <p className="text-3xl font-semibold text-white mb-4">
    ${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  </p>

  
</div>

        


        <div className="bg-[#1a1f2e] rounded-lg p-6 border border-gray-800">
  <div className="flex items-center justify-between mb-2">
    <p className="text-gray-400 text-sm">Today's Change</p>
    {dailyChange >= 0 ? (
      <TrendingUp className="w-5 h-5 text-green-500" />
    ) : (
      <TrendingDown className="w-5 h-5 text-red-500" />
    )}
  </div>
  <p className={`text-3xl font-semibold ${dailyChange >= 0 ? "text-green-500" : "text-red-500"}`}>
    {dailyChange >= 0 ? "+" : ""}${Math.abs(dailyChange).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  </p>
  <p className={`text-sm mt-1 ${dailyChange >= 0 ? "text-green-500" : "text-red-500"}`}>
    {dailyChangePercent >= 0 ? "+" : ""}{dailyChangePercent.toFixed(2)}%
  </p>
</div>


        <div className="bg-[#1a1f2e] rounded-lg p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Risk Level</p>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-3xl font-semibold text-white">Medium</p>
            <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-medium">
              Active
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1a1f2e] rounded-lg p-6 border border-gray-800">
          <h3 className="text-lg font-medium text-gray-100 mb-4">Portfolio Value Projection (30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
  <LineChart data={projectionData}>
    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
    <XAxis dataKey="day" stroke="#9ca3af" />
    <YAxis
      stroke="#9ca3af"
      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
    />
    <Tooltip
      contentStyle={{
        backgroundColor: "#1f2937",
        border: "1px solid #374151",
        borderRadius: "8px",
      }}
      formatter={(value: number | undefined) => [`$${value?.toLocaleString() ?? "N/A"}`, ""]}
    />
    <Line
      type="monotone"
      dataKey="baseline"
      stroke="#10b981"
      strokeWidth={2}
      dot={false}
      name="Median Projection"
    />
    <Line
      type="monotone"
      dataKey="p10"
      stroke="#ef4444"
      strokeWidth={1}
      dot={false}
      strokeDasharray="5 5"
      name="10th Percentile"
    />
    <Line
      type="monotone"
      dataKey="p90"
      stroke="#3b82f6"
      strokeWidth={1}
      dot={false}
      strokeDasharray="5 5"
      name="90th Percentile"
    />
  </LineChart>
</ResponsiveContainer>

  <div className="flex gap-6 mt-4 text-sm">
    <div className="flex items-center gap-2">
      <div className="w-4 h-1 bg-green-500 rounded-sm" />
      <span className="text-gray-400">Median Projection</span>
    </div>
    <div className="flex items-center gap-2">
      <div
        className="w-4 h-1 rounded-sm"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to right, #ef4444 0px, #ef4444 5px, transparent 5px, transparent 10px)",
        }}
      />
      <span className="text-gray-400">10th Percentile (Downside)</span>
    </div>
    <div className="flex items-center gap-2">
      <div
        className="w-4 h-1 rounded-sm"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to right, #3b82f6 0px, #3b82f6 5px, transparent 5px, transparent 10px)",
        }}
      />
      <span className="text-gray-400">90th Percentile (Upside)</span>
    </div>
  </div>

        </div>

        {/* Asset Allocation Chart */}
        <div className="bg-[#1a1f2e] rounded-lg p-6 border border-gray-800">
          <h3 className="text-lg font-medium text-gray-100 mb-4">Asset Allocation</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={allocationData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {allocationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {allocationData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-gray-400">{item.name}</span>
                <span className="text-sm text-gray-100 ml-auto">{item.value.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risk Metrics */}
      <div>
        <h3 className="text-lg font-medium text-gray-100 mb-4">Risk Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {riskMetrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="bg-[#1a1f2e] rounded-lg p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <Icon className="w-5 h-5 text-gray-500" />
                  {metric.trend === "up" ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <p className="text-gray-400 text-sm mb-1">{metric.label}</p>
                <p className="text-2xl font-semibold text-white">{metric.value}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}