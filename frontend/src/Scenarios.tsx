import { useState } from "react";
import { Play, Save, Download, TrendingUp, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ReferenceLine, Cell } from "recharts";

type ScenariosProps = {
  portfolio: { [ticker: string]: number };
  portfolioValue: number;
};


export function Scenarios({ portfolio = {}, portfolioValue }: ScenariosProps) {
  const [selectedScenario, setSelectedScenario] = useState("market-crash");


  const scenarios = [
    {
      id: "market-crash",
      name: "Market Crash",
      description: "S&P 500 drops by 20% over 3 months",
      impact: -15.2,
      probability: "Low",
    },
    {
      id: "tech-boom",
      name: "Tech Sector Boom",
      description: "Technology stocks rally 30%",
      impact: 22.5,
      probability: "Medium",
    },
    {
      id: "inflation-spike",
      name: "Inflation Spike",
      description: "Inflation rises to 8%, interest rates increase",
      impact: -8.3,
      probability: "Medium",
    },
    {
      id: "recession",
      name: "Economic Recession",
      description: "GDP contracts for two consecutive quarters",
      impact: -12.7,
      probability: "Low",
    },
    {
      id: "bull-market",
      name: "Bull Market",
      description: "Broad market rally across all sectors",
      impact: 18.4,
      probability: "High",
    },
  ];


  const [assetImpactData, setAssetImpactData] = useState<{ asset: string; impact: number }[]>([]);
  const [scenarioMetrics, setScenarioMetrics] = useState({
  expectedLoss: 0,
  expectedLossPct: 0,
  maxDrawdown: 0,
  VaR95: 0,
  recoveryTimeMonths: 0,
  projection: {
    median: [],
    p10: [],
    p90: [],
  }
});

  const selectedScenarioImpact = scenarios.find(s => s.id === selectedScenario)?.impact ?? 0;

  const projectionData = scenarioMetrics.projection.median.map((value, i) => ({
  day: i + 1,
  baseline: value,
  scenario: value * (1 + selectedScenarioImpact / 100),
  p10: scenarioMetrics.projection.p10[i],
  p90: scenarioMetrics.projection.p90[i],
}));


  console.log(portfolio);


  const filteredAssetImpactData = assetImpactData
  .filter(({ asset }) => asset in portfolio);

  

  async function runScenario() {
  const res = await fetch("http://localhost:8000/run-scenario", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      scenarioId: selectedScenario,
      portfolio: portfolio,  
      portfolioValue: portfolioValue
    }),
  });

  const data = await res.json();
  console.log("Scenario results:", data);

  setAssetImpactData(data.scenarioResults);

  setScenarioMetrics({
    expectedLoss: data.expectedLoss,
    expectedLossPct: data.expectedLossPct,
    maxDrawdown: data.maxDrawdown,
    VaR95: data.VaR95,
    recoveryTimeMonths: data.recoveryTimeMonths,
    projection: data.projection,
  });
}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-medium text-gray-100 mb-2">Scenario Analysis</h1>
        <p className="text-gray-400">Simulate market scenarios and assess portfolio impact</p>
      </div>

      {/* Scenario Selection */}
      <div className="bg-[#1a1f2e] rounded-lg p-6 border border-gray-800">
        <h3 className="text-lg font-medium text-gray-100 mb-4">Available Scenarios</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenarios.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => setSelectedScenario(scenario.id)}
              className={`p-4 rounded-lg border text-left transition-colors ${
                selectedScenario === scenario.id
                  ? "bg-[#2d3548] border-blue-500"
                  : "bg-[#252a3a] border-gray-700 hover:border-gray-600"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-100">{scenario.name}</h4>
                {scenario.impact > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
              </div>
              <p className="text-sm text-gray-400 mb-3">{scenario.description}</p>
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-medium ${
                    scenario.impact > 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {scenario.impact > 0 ? "+" : ""}
                  {scenario.impact}%
                </span>
                <span className="text-xs text-gray-500">
                  Probability: {scenario.probability}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Scenario Actions */}
      <div className="flex gap-3">
        <button onClick={runScenario} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
          <Play className="w-4 h-4" />
          Run Scenario
        </button>
        <button className="px-4 py-2 bg-[#2d3548] hover:bg-[#353d54] text-gray-200 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
          <Save className="w-4 h-4" />
          Save Scenario
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Value Projection */}
        <div className="bg-[#1a1f2e] rounded-lg p-6 border border-gray-800">
          <h3 className="text-lg font-medium text-gray-100 mb-4">
            Portfolio Value Projection (90 Days)
          </h3>
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
                name="Baseline"
              />
              <Line
                type="monotone"
                dataKey="scenario"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
                name="Scenario"
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-green-500" />
              <span className="text-gray-400">Baseline</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-red-500" style={{ backgroundImage: "repeating-linear-gradient(to right, #ef4444 0px, #ef4444 5px, transparent 5px, transparent 10px)" }} />
              <span className="text-gray-400">Scenario Impact</span>
            </div>
          </div>
        </div>

        {/* Impact by Asset */}
<div className="bg-[#1a1f2e] rounded-lg p-6 border border-gray-800">
  <h3 className="text-lg font-medium text-gray-100 mb-4">Impact by Asset</h3>
  <ResponsiveContainer width="100%" height={300}>
    <BarChart
  data={filteredAssetImpactData} 
  layout="vertical"
  margin={{ left: 40, right: 20 }}
>
  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
  <XAxis
    type="number"
    stroke="#9ca3af"
    tickFormatter={(value) => `${value.toFixed(0)}%`}
  />
  <YAxis type="category" dataKey="asset" stroke="#9ca3af" width={80} />
  <Tooltip
    contentStyle={{
      backgroundColor: "#1f2937",
      border: "1px solid #374151",
      borderRadius: "8px",
    }}
    formatter={(value: number | undefined) => [`${value?.toFixed(2)}%`, "Impact"]}
  />
  <ReferenceLine x={0} stroke="#9ca3af" strokeDasharray="3 3" />
  <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
    {filteredAssetImpactData.map((entry, index) => (
      <Cell
        key={`cell-${index}`}
        fill={entry.impact >= 0 ? "#10b981" : "#ef4444"}
      />
    ))}
  </Bar>
</BarChart>

  </ResponsiveContainer>
</div>

      </div>

      {/* Scenario Metrics */}
      <div className="bg-[#1a1f2e] rounded-lg p-6 border border-gray-800">
        <h3 className="text-lg font-medium text-gray-100 mb-4">Scenario Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-400 mb-1">Expected Loss</p>
            <p className="text-2xl font-semibold text-red-400">${scenarioMetrics.expectedLoss.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">{scenarioMetrics.expectedLossPct}% of portfolio</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Max Drawdown</p>
            <p className="text-2xl font-semibold text-red-400">{scenarioMetrics.maxDrawdown}%</p>
            <p className="text-xs text-gray-500 mt-1">Peak to trough</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Recovery Time</p>
            <p className="text-2xl font-semibold text-gray-200">{scenarioMetrics.recoveryTimeMonths} months</p>
            <p className="text-xs text-gray-500 mt-1">Estimated duration</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">VaR (95%)</p>
            <p className="text-2xl font-semibold text-orange-400">{scenarioMetrics.VaR95}%</p>
            <p className="text-xs text-gray-500 mt-1">Value at Risk</p>
          </div>
        </div>
      </div>

      {/* Risk Mitigation Suggestions */}
      <div className="bg-[#1a1f2e] rounded-lg p-6 border border-gray-800">
        <h3 className="text-lg font-medium text-gray-100 mb-4">Risk Mitigation Suggestions</h3>
        <div className="space-y-3">
          <div className="p-4 bg-[#252a3a] rounded-lg">
            <p className="text-sm text-gray-200 mb-1">Increase bond allocation by 10%</p>
            <p className="text-xs text-gray-500">
              This could reduce scenario impact from -15.2% to -11.8%
            </p>
          </div>
          <div className="p-4 bg-[#252a3a] rounded-lg">
            <p className="text-sm text-gray-200 mb-1">Add defensive stocks (utilities, consumer staples)</p>
            <p className="text-xs text-gray-500">
              Estimated impact reduction: -2.5%
            </p>
          </div>
          <div className="p-4 bg-[#252a3a] rounded-lg">
            <p className="text-sm text-gray-200 mb-1">Consider hedging with put options on SPY</p>
            <p className="text-xs text-gray-500">
              Potential downside protection: up to 8%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}