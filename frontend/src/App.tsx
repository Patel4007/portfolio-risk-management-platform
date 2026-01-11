import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Overview } from "./Overview";
import { Scenarios } from "./Scenarios";
import { Assistant } from "./Assistant";
import { User, LogOut } from "react-feather";
import { supabase } from "./supabaseClient";
import "./App.css";
import {AnalyticsCharts} from "./charts/AnalyticsCharts";
import { PortfolioRiskChart } from "./charts/PortfolioRiskChart";
import { AssetSelector } from "./AssetSelector";
import { PortfolioPieChart } from "./charts/PortfolioPieChart";
import { Modal } from "./charts/Modal";
import { usePortfolio } from "./hooks/usePortfolio";
import {assetOptions} from "./AssetSelector";

const {
  portfolio,
  setPortfolio,
  liquidCash,
  setLiquidCash,
  initialPortfolioValue,
  setInitialPortfolioValue,
  addStock,
  removeStock
} = usePortfolio();

export const normalizeTicker = (t: string) =>
  t.trim().toUpperCase();

type AnalyticsData = {
  best_day: number;
  worst_day: number;
  cumulative_returns: { date: string; value: number }[];
  drawdown_series: { date: string; drawdown: number }[];
  return_histogram: { bin: string; count: number }[];
};

type RiskResponse = {
  var: number;
  es: number;
  sharpe: number;
  max_drawdown: number;
  volatility?: number;
  beta?: number;
};

type RiskData = {
  portfolio: RiskResponse;
  portfolio_analytics: AnalyticsData;
  assets: {
    [ticker: string]: RiskResponse;
  };
  assets_analytics: { [ticker: string]: AnalyticsData };
};

type View =
  | "overview"
  | "portfolio"
  | "risk"
  | "analytics"
  | "scenarios"
  | "assistant";


const getUserId = async (): Promise<string | null> => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user.id;
};

const { data: { session } } = await supabase.auth.getSession();

if (!session) {
  console.error("User not authenticated");
}



const assetCategoryMap: Record<string, string> = {};

assetOptions.forEach(group => {
  group.options.forEach(asset => {
    assetCategoryMap[normalizeTicker(asset.value)] = group.label;
  });
});

const AVAILABLE_STOCKS = ["AAPL", "GOOG", "TSLA", "AMZN", "VOO", "SPY",
  "BND", "AGG", "VXUS", "VTIVX", "US_HPI",
  "BTC", "ETH", "SOL"];


const App: React.FC = () => {


  const tickers = Object.keys(portfolio);
  const weights = Object.values(portfolio).map(w => w / 100);

  const computePortfolioValue = () => {
  if (!riskData) return initialPortfolioValue + liquidCash;

  const tickers = Object.keys(portfolio);
  if (tickers.length === 0) return liquidCash;

  // Calculate portfolio return based on latest available value for each asset
  let portfolioReturn = 0;

  tickers.forEach(ticker => {
    const assetAnalytics = riskData.assets_analytics?.[ticker];
    if (!assetAnalytics) return;

    const cumReturns = assetAnalytics.cumulative_returns;
    if (!cumReturns || cumReturns.length === 0) return;

    const lastReturn = cumReturns[cumReturns.length - 1].value / 100; 
    const weight = (portfolio[ticker] ?? 0) / 100;
    portfolioReturn += lastReturn * weight;
  });

  // Portfolio value = initial capital * weighted return + cash
  return initialPortfolioValue * (1 + portfolioReturn) + liquidCash;
};


  const [portfolioValue, setPortfolioValue] = useState<number>(100_000);

  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("access_token"));

  const navigate = useNavigate();

  const [view, setView] = useState<View>("risk");

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [tempLiquidCash, setTempLiquidCash] = useState<number>(0);

  // Risk data from backend
  const [riskData, setRiskData] = useState<RiskData | null>(null);
  
  const [activeTab, setActiveTab] = useState<"risk" | "analytics">("risk");

  // Editing state
  const [editing, setEditing] = useState(false);
  const [tempWeights, setTempWeights] = useState<{[ticker: string]: number}>({ ...portfolio });

  const [tempInitialPortfolioValue, setTempInitialPortfolioValue] = useState<number>(100000);

  useEffect(() => {
  
    const totalAssetsValue = Object.values(portfolio).reduce((a,b) => a + b, 0);
    const totalValue = totalAssetsValue + liquidCash;

    if (totalValue === 0) {
      setRiskData(null);
    return;
  }

    const normalizedWeights = Object.keys(portfolio).map(t => portfolio[t] / totalValue);
    const cashWeight = liquidCash / totalValue;

    const allTickers = [...Object.keys(portfolio), "CASH"];
    const allWeights = [...normalizedWeights, cashWeight];


  fetch("http://localhost:8000/risk", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ tickers: allTickers, weights: allWeights, portfolio_value: totalValue })
  })
    .then(res => res.json())
    .then(data => setRiskData(data))
    .catch(err => console.error("API error:", err));
}, [portfolio, liquidCash]);


  useEffect(() => {
  const syncAuthState = () => {
    const token = localStorage.getItem("access_token");
    const loggedIn = !!token;

    setIsLoggedIn(prev => {
      if (prev === loggedIn) return prev;
      return loggedIn;
    });
  };

  window.addEventListener("storage", syncAuthState);
  syncAuthState();

  return () => window.removeEventListener("storage", syncAuthState);
}, []);

useEffect(() => {
  if (!isLoggedIn) {
    navigate("/signin");
  }
}, [isLoggedIn, navigate]);

useEffect(() => {
  const value = computePortfolioValue();
  setPortfolioValue(value);
}, [riskData, liquidCash, initialPortfolioValue]);
  
  
  // Edit weights handlers

  const startEditing = () => {
  setTempWeights({ ...portfolio });
  setTempLiquidCash(liquidCash);
  setEditing(true);
};

const cancelEditing = () => {
  setEditing(false);
  setTempWeights({ ...portfolio });
  setTempLiquidCash(liquidCash);
};

const saveWeights = async () => {
  const userId = await getUserId();
  if (!userId) {
    console.error("User not authenticated");
    return;
  }

  const total = Object.values(tempWeights).reduce((a,b) => a + b, 0) + tempLiquidCash;

  if (total === 0) return;
const normalizedAssets = Object.fromEntries(
  Object.entries(tempWeights).map(([t,w]) => [t, (w / total) * 100])
);

  // Build rows for Supabase
  const rows = Object.entries(normalizedAssets).map(
    ([ticker, weight]) => ({
      user_id: userId,
      ticker,
      weight,
      updated_at: new Date().toISOString(),
    })
  );

  rows.push({
    user_id: userId,
    ticker: "CASH",
    weight: tempLiquidCash,
    updated_at: new Date().toISOString(),
  });

  try {
    
    const { error: assetsError } = await supabase
      .from("portfolio_assets")
      .upsert(rows, {
        onConflict: "user_id,ticker",
      });

    if (assetsError) {
      console.error("Supabase save error:", assetsError);
      return;
    }

    // Upsert initial portfolio value
    const { error: initialError } = await supabase
      .from("portfolio_initial")
      .upsert([
        {
          user_id: userId,
          initial_value: tempInitialPortfolioValue,
          updated_at: new Date().toISOString(),
        },
      ], { onConflict: "user_id" });

    if (initialError) {
      console.error("Supabase save initial value error:", initialError);
      return;
    }

    setPortfolio(normalizedAssets);
    setLiquidCash(tempLiquidCash);
    setInitialPortfolioValue(tempInitialPortfolioValue);
    setEditing(false);

  } catch (err) {
    console.error("Error saving portfolio:", err);
  }
};


const updateTempWeight = (ticker: string, value: string) => {
  let num = parseFloat(value);
  if (isNaN(num) || num < 0) num = 0;
  setTempWeights(prev => ({ ...prev, [ticker]: num }));
};

const updateTempLiquidCash = (value: string) => {
  let num = parseFloat(value);
  if (isNaN(num) || num < 0) num = 0;
  setTempLiquidCash(num);
};


  const computeRollingRisk = (analytics: AnalyticsData): { date: string; risk: number }[] => {
  const returns = analytics.cumulative_returns.map((v, i, arr) => {
    if (i === 0) return 0;
    return (arr[i].value - arr[i - 1].value);
  });

  const window = 20;
  const riskSeries: { date: string; risk: number }[] = [];

  for (let i = window; i < returns.length; i++) {
    const slice = returns.slice(i - window, i);
    const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
    const variance =
      slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / slice.length;

    const dailyVol = Math.sqrt(variance);
    const annualizedVol = dailyVol * Math.sqrt(252);

    riskSeries.push({
      date: analytics.cumulative_returns[i].date,
      risk: annualizedVol
    });
  }

  return riskSeries;
};

const userEmail = localStorage.getItem("user_email");

  const handleSignOut = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user_email");
  window.dispatchEvent(new Event("storage"));

  navigate("/signin");
};


  return (

    <div className={`layout ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
    <aside className="sidebar">
      <div className="sidebar-title">Risk Platform</div>

      <div
        className={`sidebar-item ${view === "overview" ? "active" : ""}`}
        onClick={() => setView("overview")}
      >
        Overview
      </div>

      <div
        className={`sidebar-item ${view === "portfolio" ? "active" : ""}`}
        onClick={() => setView("portfolio")}
      >
        Portfolio
      </div>

      <div
        className={`sidebar-item ${view === "scenarios" ? "active" : ""}`}
        onClick={() => setView("scenarios")}
      >
        Scenarios
      </div>

      <div
        className={`sidebar-item ${view === "assistant" ? "active" : ""}`}
        onClick={() => setView("assistant")}
      >
        Assistant
      </div>

      {/* User Profile Section */}
        <div className="p-4 border-t border-gray-800">
          <div className="mb-3 px-4 py-2 bg-[#252a3a] rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-gray-400" />
              <p className="text-xs font-medium text-gray-300">Account</p>
            </div>
            <p className="text-xs text-gray-500 truncate">{userEmail}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:bg-[#252a3a] hover:text-gray-200 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
    </aside>
  

    <div className="app-root">

    <button
      className="sidebar-toggle"
      onClick={() => setSidebarOpen(!sidebarOpen)}
    >
      {sidebarOpen ? "☰" : "☰"}
    </button>

    {view === "overview" && <Overview riskData={riskData} tickers={tickers} weights={weights} portfolio={portfolio} portfolioValue={portfolioValue} assetCategoryMap={assetCategoryMap}  />}
{view === "scenarios" && <Scenarios portfolio={portfolio} portfolioValue={portfolioValue}/>}
{view === "assistant" && <Assistant />}

{(view === "risk" || view === "analytics" || view === "portfolio") && (
<>
      <h1>Portfolio Risk & Management Panel</h1>

      <div className="section">
  <div className="chip-row">
    <div
      className="chip"
      style={{ opacity: activeTab === "risk" ? 1 : 0.6 }}
      onClick={() => setActiveTab("risk")}
    >
      Risk
    </div>
    <div
      className="chip"
      style={{ opacity: activeTab === "analytics" ? 1 : 0.6 }}
      onClick={() => setActiveTab("analytics")}
    >
      Analytics
    </div>
  </div>
</div>


     <div className="section">
  <div className="section-title">Add Stocks to Portfolio</div>
  <AssetSelector portfolio={portfolio} addAsset={addStock} />

  <div className="chip-row" style={{ marginTop: "10px" }}>
    {AVAILABLE_STOCKS.map(s => (
      <div
        key={s}
        className="chip"
        style={{ opacity: portfolio[s] ? 0.4 : 1, cursor: portfolio[s] ? "not-allowed" : "pointer" }}
        onClick={() => addStock(s)}
      >
        + {s}
      </div>
    ))}
  </div>
</div>

      <div className="section">
        <div className="section-title">Current Portfolio & Weights</div>
        <div className="weights-bar">
          <div className="weights">
  {editing ? (
    <>
      {Object.entries(tempWeights).map(([ticker, weight]) => (
        <span key={ticker}>
          {ticker}{" "}
          <input
            type="number"
            min={0}
            max={100}
            value={weight.toFixed(2)}
            onChange={e => updateTempWeight(ticker, e.target.value)}
            style={{ width: "60px", marginRight: "12px" }}
          />%
        </span>
      ))}
      <span>
  CASH $
  <input
    type="number"
    min={0}
    value={tempLiquidCash.toFixed(2)}
    onChange={e => updateTempLiquidCash(e.target.value)}
    style={{ width: "80px", marginRight: "12px" }}
  />
</span>

    </>
  ) : (
    <>
      {Object.entries(portfolio).map(([ticker, weight]) => (
  <span key={ticker} style={{ display: "inline-flex", alignItems: "center" }}>
    {ticker} {weight.toFixed(2)}%
    <button
      onClick={() => !editing && removeStock(ticker)}
      style={{
        marginLeft: "6px",
        background: "transparent",
        border: "none",
        color: "white",
        cursor: "pointer",
        fontSize: "16px",
        fontWeight: "bold",
      }}
      title={`Remove ${ticker}`}
    >
      −
    </button>
  </span>
))}
     <span style={{ display: "inline-flex", alignItems: "center" }}>
  CASH {liquidCash.toFixed(2)}%
</span>

    </>
  )}
</div>    
        <button className="edit-btn" onClick={startEditing}>Edit Weights</button>
        </div>
        <Modal isOpen={editing} onClose={cancelEditing}>
    <h3>Edit Portfolio Weights</h3>
    {/* Initial Portfolio Value Input */}
  <div style={{ marginBottom: "12px" }}>
    <label>Initial Portfolio Value ($): </label>
    <input
      type="number"
      min={0}
      value={tempInitialPortfolioValue.toFixed(2)}
      onChange={(e) => {
        let val = parseFloat(e.target.value);
        if (isNaN(val) || val < 0) val = 0;
        setTempInitialPortfolioValue(val);
      }}
      style={{ width: "120px", marginLeft: "8px" }}
    />
  </div>
    <table className="weights-table">
      <thead>
        <tr>
          <th>Asset</th>
          <th>Weight (%)</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(tempWeights).map(([ticker, weight]) => (
          <tr key={ticker}>
            <td>{ticker}</td>
            <td>
              <input
                type="number"
                min={0}
                max={100}
                value={weight.toFixed(2)}
                onChange={(e) => updateTempWeight(ticker, e.target.value)}
                style={{ width: "60px" }}
              />%
            </td>
          </tr>
        ))}
        <tr>
          <td>CASH</td>
          <td>
            <input
              type="number"
              min={0}
              value={tempLiquidCash.toFixed(2)}
              onChange={(e) => updateTempLiquidCash(e.target.value)}
              style={{ width: "80px" }}
            />
          </td>
        </tr>
      </tbody>
    </table>

   <div className="modal-buttons">
  <button className="edit-btn" onClick={saveWeights}>Save</button>
  <button className="edit-btn" onClick={cancelEditing}>Cancel</button>
</div>
  </Modal>
      </div>

      {activeTab === "risk" && (
  <div className="card">
    <div className="risk-header">
      <h3>Portfolio Risk Summary</h3>
      <div className="risk-badge">Risk Level: MEDIUM</div>
    </div>

    {riskData && (
      <div className="metrics">
        <div>10-Day VaR: {(riskData.portfolio.var * 100).toFixed(2)}%</div>
        <div>10-Day ES: {(riskData.portfolio.es * 100).toFixed(2)}%</div>
        <div>Max Drawdown: {(riskData.portfolio.max_drawdown * 100).toFixed(2)}%</div>
        <div>Sharpe Ratio: {riskData.portfolio.sharpe.toFixed(2)}</div>
      </div>
    )}

    {riskData?.portfolio_analytics && (
  <>
    <div style={{ fontSize: "14px", marginBottom: "6px", opacity: 0.85 }}>
      Portfolio Risk Trend (Rolling Volatility)
    </div>

    <PortfolioRiskChart
      data={computeRollingRisk(riskData.portfolio_analytics)}
    />
  </>
)}
  </div>
)}

{activeTab === "analytics" && riskData?.portfolio_analytics &&(
  <div className="grid-2">
  <div className="card">
    <h3>Portfolio Distribution</h3>
    <PortfolioPieChart portfolio={portfolio} />
  </div>

 

  <div className="card">
    <h3>Portfolio Analytics</h3>

    <div className="metrics">
      <div>Best Day: {(riskData.portfolio_analytics.best_day * 100).toFixed(2)}%</div>
      <div>Worst Day: {(riskData.portfolio_analytics.worst_day * 100).toFixed(2)}%</div>
    </div>

    <AnalyticsCharts data={riskData.portfolio_analytics} />
  </div>
  </div>
)}

      <div className="grid-3">
  {Object.entries(portfolio).map(([ticker]) => {
    const assetRisk = riskData?.assets?.[ticker];
    const assetAnalytics = riskData?.assets_analytics?.[ticker];

    const varPct = assetRisk?.var ?? 0;

    let riskLevel: "low" | "medium" | "high" = "low";
    if (varPct > 0.1) riskLevel = "high";
    else if (varPct > 0.05) riskLevel = "medium";

    return (
      <div key={ticker} className="card">
        <div className="asset-title">{ticker} Risk Summary</div>
        <div className={`asset-badge ${riskLevel}`}>
          Risk Level: {riskLevel.toUpperCase()}
        </div>

        {/* ---------- RISK TAB ---------- */}
        {activeTab === "risk" && (
          assetRisk ? (
            <div className="metrics">
              <div>10-Day VaR: {(assetRisk.var * 100).toFixed(2)}%</div>
              <div>10-Day ES: {(assetRisk.es * 100).toFixed(2)}%</div>
              <div>Max Drawdown: {(assetRisk.max_drawdown * 100).toFixed(2)}%</div>
              <div>Sharpe Ratio: {assetRisk.sharpe.toFixed(2)}</div>
            </div>
          ) : (
            <div className="metrics">Risk data not available.</div>
          )
        )}

        {/* ---------- ANALYTICS TAB ---------- */}
        {activeTab === "analytics" && (
          assetAnalytics ? (
            <>
              <div className="metrics">
                <div>
                  Best Day: {(assetAnalytics.best_day * 100).toFixed(2)}%
                </div>
                <div>
                  Worst Day: {(assetAnalytics.worst_day * 100).toFixed(2)}%
                </div>
              </div>

              <AnalyticsCharts data={assetAnalytics} />
            </>
          ) : (
            <div className="metrics">Analytics data not available.</div>
          )
        )}
      </div>
    );
  })}
</div>

    </>
)}
</div>
</div>
  );
};

export default App;