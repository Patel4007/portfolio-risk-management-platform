
import numpy as np
from betas import ASSET_BETAS
from hmmlearn.hmm import GaussianHMM

FACTORS = [
    "market",
    "rates",
    "inflation",
    "growth",
    "liquidity",
    "tech",
    "risk_on"
]

SCENARIOS = {
    # Market Crash: equities drop, tech drops, volatility spikes, bonds up slightly
    "market-crash": dict(zip(FACTORS, [
        -0.20,  # equity_market
        -0.15,  # tech_factor
        +0.05,  # interest_rate rises slightly
        +0.02,  # inflation minor rise
        -0.05,  # commodity drop
        +0.10,  # volatility spike
        0.00    # currency unchanged
    ])),

    # Tech Boom: tech rallies, equities rise, volatility drops, commodities mild
    "tech-boom": dict(zip(FACTORS, [
        +0.10,  # equity_market
        +0.25,  # tech_factor strong positive
        -0.05,  # interest_rate slight drop
        +0.01,  # inflation minor
        +0.05,  # commodity mild rise
        -0.08,  # volatility drops
        -0.02   # currency small decline
    ])),

    # Inflation Spike: rates and inflation rise, equities drop, bonds drop, commodities up
    "inflation-spike": dict(zip(FACTORS, [
    -0.08,   # equity_market: small market drop
    -0.10,   # tech_factor: tech under pressure
    +0.35,   # interest_rate: bonds benefit moderately
    +0.25,   # inflation: bonds benefit, equities slightly hurt
    +0.10,   # commodity: mild positive
    +0.12,   # volatility: slight positive for VTIVX
    -0.05    # currency: minor USD depreciation
])),


    # Recession: equities drop, tech drops, bonds rise, commodities drop, volatility rises
    "recession": dict(zip(FACTORS, [
        -0.15,  # equity_market
        -0.10,  # tech_factor negative
        -0.05,  # interest_rate slight drop
        -0.10,  # inflation falls
        -0.15,  # commodity falls
        +0.20,  # volatility spikes
        +0.02   # currency slight appreciation
    ])),

    # Bull Market: equities rise, tech rises, bonds mild decline, volatility down
    "bull-market": dict(zip(FACTORS, [
        +0.18,  # equity_market
        +0.20,  # tech_factor
        -0.02,  # interest_rate mild drop
        +0.01,  # inflation minor
        +0.10,  # commodity rise
        -0.08,  # volatility drops
        -0.05   # currency minor depreciation
    ])),
}


def get_scenario_impacts(scenario_dict):
    
    scenario_vector = np.array([scenario_dict[f] for f in FACTORS])
    
    results = []
    for asset, beta_vector in ASSET_BETAS.items():
        
        raw_impact = np.dot(beta_vector, scenario_vector)
        
        results.append({
            "asset": asset,
            "impact": round(raw_impact * 100, 2) 
        })
    return results


def simulate_portfolio(
    initial_value=1_000_000,
    mu=0.08,
    sigma=0.15,
    days=365,
    paths=5000,
    seed=42  
):
    np.random.seed(seed)  
    dt = 1 / 252
    returns = np.random.normal((mu - 0.5 * sigma**2) * dt, sigma * np.sqrt(dt), size=(paths, days))
    price_paths = initial_value * np.exp(np.cumsum(returns, axis=1))
    return price_paths
    

def scenario_adjusted_params(base_mu, base_sigma, scenario):
    
    mu = base_mu + scenario[0]
    sigma = base_sigma * (1 + scenario[1])
    return mu, sigma


def expected_loss(paths, initial_value):
    return initial_value - np.mean(paths[:, -1])

def max_drawdown(paths):
    peak = np.maximum.accumulate(paths, axis=1)
    drawdowns = (paths - peak) / peak
    return np.percentile(drawdowns.min(axis=1), 50)

def value_at_risk(paths, initial_value, alpha=0.05):
    returns = (paths[:, -1] - initial_value) / initial_value
    return np.quantile(returns, alpha)


def estimate_recovery_time(paths, initial_value):
    """
    Estimate recovery time AFTER crash using regime-based mean reversion.
    """

    # --- Measure drawdown severity ---
    path_dds = []
    trough_prices = []

    for path in paths:
        peak = np.maximum.accumulate(path)
        dd = (path - peak) / peak
        path_dds.append(abs(dd.min()))
        trough_prices.append(path[np.argmin(dd)])

    portfolio_dd = np.percentile(path_dds, 75)
    median_trough = np.median(trough_prices)

    # --- Regime-based recovery speed ---
    if portfolio_dd > 0.35:
        theta = 0.10   # crisis 
    elif portfolio_dd > 0.20:
        theta = 0.18   # recession
    else:
        theta = 0.30   # correction

    # --- Simulate recovery explicitly ---
    days = 3 * 252   # allow up to 3 years
    dt = 1 / 252
    sigma = 0.15

    prices = np.full(len(trough_prices), median_trough)
    recovered_days = []

    for t in range(1, days):
        drift = theta * (initial_value - prices) * dt
        diffusion = sigma * prices * np.random.normal(0, np.sqrt(dt), size=len(prices))
        prices = prices + drift + diffusion

        hit = prices >= initial_value
        if hit.any():
            recovered_days.append(t)
            prices = prices[~hit]
            if len(prices) == 0:
                break

    if not recovered_days:
        return 36.0  # cap at 3 years

    median_days = np.percentile(recovered_days, 60)
    return round(median_days / 21, 1)

def summarize_paths(paths):
    return {
        "median": np.median(paths, axis=0),
        "p10": np.percentile(paths, 10, axis=0),
        "p90": np.percentile(paths, 90, axis=0),
    }