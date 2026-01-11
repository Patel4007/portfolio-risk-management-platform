import numpy as np
import pandas as pd

def sharpe_ratio(returns, rf=0.0, annualize=True):
    excess = returns - rf
    sr = excess.mean() / excess.std()
    return sr * np.sqrt(252) if annualize else sr


def max_drawdown(returns, is_log_returns=False):
    if is_log_returns:
        wealth_index = pd.exp(returns.cumsum())
    else:
        wealth_index = (1 + returns).cumprod()
    
    peak = wealth_index.cummax()
    drawdown = (wealth_index - peak) / peak
    max_dd = abs(drawdown.min())
    return max_dd

def scale_risk(mu_daily, sigma_daily, T_days):
    mu_T = mu_daily * T_days
    sigma_T = sigma_daily * np.sqrt(T_days)
    return mu_T, sigma_T

def annualized_volatility(returns: np.ndarray) -> float:
    return float(np.std(returns) * np.sqrt(252))


def portfolio_beta(portfolio_returns: pd.Series, market_returns: pd.Series) -> float:
    aligned = pd.concat([portfolio_returns, market_returns], axis=1).dropna()
    cov = np.cov(aligned.iloc[:, 0], aligned.iloc[:, 1])[0][1]
    var = np.var(aligned.iloc[:, 1])
    return float(cov / var) if var != 0 else 0.0