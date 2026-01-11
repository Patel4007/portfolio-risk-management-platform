import requests
import pandas as pd
import yfinance as yf
import numpy as np
from arch import arch_model
import subprocess, json
from risk_metrics import annualized_volatility, portfolio_beta, sharpe_ratio, max_drawdown

ASSET_METADATA = {
    # Popular stocks (equity_etf type or just "equity")
    "AAPL": {"type": "equity_etf", "ticker": "AAPL"},
    "GOOG": {"type": "equity_etf", "ticker": "GOOG"},
    "TSLA": {"type": "equity_etf", "ticker": "TSLA"},
    "AMZN": {"type": "equity_etf", "ticker": "AMZN"},
    # Existing entries ...
    "VOO": {"type": "equity_etf", "ticker": "VOO"},
    "SPY": {"type": "equity_etf", "ticker": "SPY"},
    "BND": {"type": "bond_etf", "ticker": "BND"},
    "AGG": {"type": "bond_etf", "ticker": "AGG"},
    "VXUS": {"type": "intl_equity", "ticker": "VXUS"},
    "VTIVX": {"type": "target_date", "ticker": "VTIVX"},
    "US_HPI": {"type": "real_estate", "series": "CSUSHPINSA"},
    "BTC": {"type": "equity_etf", "ticker": "BTC-USD"},
    "ETH": {"type": "equity_etf", "ticker": "ETH-USD"},
    "SOL": {"type": "equity_etf", "ticker": "SOL-USD"},
    "USD": {"type": "equity_etf", "ticker": "DX-Y.NYB"},
    "GOLD": {"type": "equity_etf", "ticker": "GLD"},
    "SILVER": {"type": "equity_etf", "ticker": "SLV"},
    "CASH": {"type": "equity_etf", "ticker": "BIL"},
    "OIL": {"type": "equity_etf", "ticker": "USO"},
}



def run_var_engine(mu: float, sigma: float) -> dict:
    proc = subprocess.run(
        ['/Users/jaypatel/Desktop/risk_engine_project/var_engine'],
        input=f"{mu} {sigma}",
        text=True,
        capture_output=True,
        check=True
    )
    return json.loads(proc.stdout)

def fetch_asset_prices(asset: dict) -> pd.DataFrame:
    asset_type = asset["type"]

    if asset_type == "real_estate":
        df = fetch_case_shiller(asset["series"])
        price_col = "value"

    elif asset_type in ["equity_etf", "bond_etf", "intl_equity", "target_date"]:
        df = fetch_yahoo(asset["ticker"])
        price_col = "price"

    else:
        raise ValueError(f"Unsupported asset type: {asset_type}")

    df = df.sort_values("date").set_index("date")

    returns = np.log(df[price_col] / df[price_col].shift(1)).dropna()

    return returns

def fetch_case_shiller(series_id):
    url = "https://api.stlouisfed.org/fred/series/observations"
    params = {
        "series_id": series_id,
        "api_key": "0530154e311d2a281da4de8a9e1beaf1",
        "file_type": "json"
    }

    r = requests.get(url, params=params).json()

    df = pd.DataFrame(r["observations"])
    df["date"] = pd.to_datetime(df["date"])
    df["value"] = pd.to_numeric(df["value"], errors="coerce")
    df = df.dropna()

    df = df.set_index("date").resample("D").ffill().reset_index()

    return df[["date", "value"]]



def fetch_yahoo(ticker: str) -> pd.DataFrame:
    data = yf.download(
        ticker,
        start="2000-01-01",
        auto_adjust=True,
        progress=False
    )

    if data.empty:
        raise ValueError(f"No Yahoo data for {ticker}")

    return (
        data[["Close"]]
        .rename(columns={"Close": "price"})
        .reset_index()
        .rename(columns={"Date": "date"})
    )


def compute_risk_metrics(returns: np.ndarray):
    
    if len(returns) < 50 or np.std(returns) == 0:

        return {"var": 0.0, "es": 0.0, "sharpe": 0.0, "max_drawdown": 0.0}

    try:
        scaled_returns = returns * 100   

        am = arch_model(scaled_returns, vol="Garch", p=1, q=1)
        res = am.fit(disp="off")

        mu_1d = res.params["mu"] / 100
        sigma_1d = (
            res.conditional_volatility[-1] / 100
            if isinstance(res.conditional_volatility, np.ndarray)
            else res.conditional_volatility.iloc[-1] / 100
        )

        mu_10d = mu_1d * 10
        sigma_10d = sigma_1d * np.sqrt(10)

        var_es = run_var_engine(mu_10d, sigma_10d)

        spy_returns = fetch_asset_prices(ASSET_METADATA["SPY"])
        spy_returns = spy_returns.loc[returns.index]
        

        return {
            "var": var_es["var"],
    "es": var_es["es"],
    "sharpe": sharpe_ratio(returns),
    "max_drawdown": max_drawdown(returns),
    "volatility": annualized_volatility(returns),   
    "beta": portfolio_beta(                          
        pd.Series(returns),
        spy_returns.squeeze()                        
    ),
        }

    except Exception as e:
        print("Risk calculation failed:", e)
        return {
            "var": 0.0,
            "es": 0.0,
            "sharpe": 0.0,
            "max_drawdown": 0.0
        }
    
    
    
def compute_analytics(returns):
    if isinstance(returns, np.ndarray):
        returns = pd.Series(returns)

    cum = (1 + returns).cumprod() - 1
    dd = cum / cum.cummax() - 1

    hist, bins = np.histogram(returns, bins=40)

    return {
        "best_day": float(np.max(returns)),
        "worst_day": float(np.min(returns)),
        "cumulative_returns": [
            {"date": str(d.date()) if hasattr(d, "date") else str(i), "value": float(v)}
            for i, (d, v) in enumerate(zip(returns.index if hasattr(returns, "index") else range(len(returns)), cum))
        ],
        "drawdown_series": [
            {"date": str(d.date()) if hasattr(d, "date") else str(i), "drawdown": float(v)}
            for i, (d, v) in enumerate(zip(returns.index if hasattr(returns, "index") else range(len(returns)), dd))
        ],
        "return_histogram": [
            {"bin": f"{bins[i]:.2%}", "count": int(hist[i])}
            for i in range(len(hist))
        ]
    }

def compute_today_change(portfolio_returns: pd.Series, portfolio_value: float, cash_flow_today=0.0):
    if len(portfolio_returns) < 2:
        return {"change_abs": 0.0, "change_pct": 0.0}

    latest_return = portfolio_returns.iloc[-1]
    change_abs = portfolio_value * latest_return - cash_flow_today
    change_pct = latest_return * 100

    return {
        "change_abs": round(change_abs, 2),
        "change_pct": round(change_pct, 2)
    }





def compute_portfolio_risk_dynamic(tickers, weights, portfolio_value):
    weights = np.array(weights)

    

    # Collect individual asset returns in a dict
    asset_returns_dict = {}

    for ticker in tickers:
        meta = ASSET_METADATA.get(ticker)
        if not meta:
            print(f"Warning: Asset metadata missing for ticker {ticker}")
            continue
        
        try:
            returns = fetch_asset_prices(meta)
            asset_returns_dict[ticker] = returns
        except Exception as e:
            print(f"Failed fetching returns for {ticker}: {e}")

    if not asset_returns_dict:
        raise ValueError("No valid asset returns found.")

    # Align all returns by date (intersection)
    combined_returns = pd.concat(asset_returns_dict.values(), axis=1, join='inner')
    combined_returns.columns = list(asset_returns_dict.keys())

    # Align weights to tickers actually fetched
    valid_tickers = combined_returns.columns.tolist()
    aligned_weights = []
    for t in valid_tickers:
        idx = tickers.index(t)
        aligned_weights.append(weights[idx])

    
    aligned_weights = np.array(aligned_weights, dtype=float)

    if np.sum(aligned_weights) == 0:
        aligned_weights = np.ones(len(aligned_weights)) / len(aligned_weights)
    else:
        aligned_weights /= np.sum(aligned_weights)
      

    # Calculation of portfolio returns
    portfolio_returns = pd.Series(
    combined_returns.values @ aligned_weights,
    index=combined_returns.index,
    name="portfolio"
)
    portfolio_risk = compute_risk_metrics(portfolio_returns)

    portfolio_analytics = compute_analytics(
        returns=pd.Series(portfolio_returns, index=combined_returns.index)
    )

    today_change = compute_today_change(portfolio_returns, portfolio_value)

    assets_risk = {}
    assets_analytics = {}

    # Calculation of risk & analytics per asset
    for ticker in valid_tickers:
        try:
            r = combined_returns[ticker]
            assets_risk[ticker] = compute_risk_metrics(r)
            assets_analytics[ticker] = compute_analytics(r)

        except Exception as e:
            assets_risk[ticker] = {
                "var": 0,
                "es": 0,
                "sharpe": 0,
                "max_drawdown": 0,
                "error": str(e)
            }
            assets_analytics[ticker] = {
                "best_day": 0,
                "worst_day": 0,
                "cumulative_returns": [],
                "drawdown_series": [],
                "return_histogram": []
            }

    return {
        "portfolio": portfolio_risk,
        "assets": assets_risk,
        "portfolio_analytics": portfolio_analytics,
        "assets_analytics": assets_analytics,
        "today_change": today_change
    }

def build_positions_from_capital(capital: float, tickers: list, weights: list):
    positions = {}

    for ticker, w in zip(tickers, weights):
        meta = ASSET_METADATA[ticker]
        prices = fetch_asset_prices(meta)
        latest_price = np.exp(prices.iloc[-1]) if prices.mean() < 0.5 else prices.iloc[-1]

        allocation = capital * w
        shares = allocation / latest_price

        positions[ticker] = float(shares)

    return positions

def apply_cash_flow(positions, cash_amount, prices):
    total_value = sum(positions[t] * prices[t] for t in positions)

    for ticker in positions:
        weight = (positions[ticker] * prices[ticker]) / total_value
        positions[ticker] += (cash_amount * weight) / prices[ticker]

    return positions

def compute_portfolio_value(positions):
    value = 0
    for ticker, shares in positions.items():
        meta = ASSET_METADATA[ticker]
        prices = fetch_asset_prices(meta)
        latest_price = np.exp(prices.iloc[-1]) if prices.mean() < 0.5 else prices.iloc[-1]
        value += shares * latest_price
    return round(value, 2)
