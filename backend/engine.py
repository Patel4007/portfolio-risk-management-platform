
from scenarios import SCENARIOS, get_scenario_impacts, simulate_portfolio, scenario_adjusted_params, expected_loss, max_drawdown, summarize_paths, value_at_risk, estimate_recovery_time
from betas import ASSET_BETAS
import numpy as np


def run_scenario(scenario_id, portfolio, portfolio_value):
    """
    scenario_id: string like 'market-crash'
    portfolio: dict, e.g. {'AAPL': 0.3, 'GOOG': 0.5, 'TSLA': 0.2}
    portfolio_value: float, e.g. 1_000_000
    """
    initial_value = portfolio_value
    scenario = SCENARIOS[scenario_id]
    scenario_vector = np.array(list(scenario.values()))

    filtered_betas = {asset: beta for asset, beta in ASSET_BETAS.items() if asset in portfolio}
    asset_impacts = {}
    for asset, beta in filtered_betas.items():
        impact = np.dot(beta, scenario_vector)
        # Weight impact by portfolio allocation
        weighted_impact = impact * portfolio[asset]
        asset_impacts[asset] = round(weighted_impact * 100, 2)

    # Portfolio-level parameters adjusted by scenario
    mu, sigma = scenario_adjusted_params(0.08, 0.15, scenario_vector)

    # Simulate portfolio price paths
    paths = simulate_portfolio(
        initial_value=initial_value,
        mu=mu, 
        sigma=sigma, 
        days=365,
        seed=hash(scenario_id) % (2**32)
    )


    # Calculate portfolio-level risk metrics
    
    el = expected_loss(paths, initial_value)
    dd = max_drawdown(paths)
    var = value_at_risk(paths, initial_value)
    recovery = estimate_recovery_time(paths, initial_value)
    scenario_results = get_scenario_impacts(scenario)
    summary = summarize_paths(paths)

    return {
        "assetImpact": asset_impacts,
        "expectedLoss": round(el, 0),
        "expectedLossPct": round(el / initial_value * 100, 2),
        "maxDrawdown": round(dd * 100, 2),
        "VaR95": round(var * 100, 2),
        "scenarioResults": scenario_results,
        "recoveryTimeMonths": recovery,
        "projection": {
        "median": summary["median"][:90].tolist(),
        "p10": summary["p10"][:90].tolist(),
        "p90": summary["p90"][:90].tolist(),
        }
    }
