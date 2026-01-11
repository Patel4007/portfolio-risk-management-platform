
import numpy as np

import numpy as np

ASSET_BETAS = {
    "AAPL": np.array([1.2, 0.8, -0.3, -0.2, 0.6, 1.1, 0.4]),
    "GOOG": np.array([1.1, 0.7, -0.2, -0.1, 0.5, 1.0, 0.3]),
    "TSLA": np.array([1.6, 1.2, -0.1, -0.1, 0.7, 1.5, 0.6]),
    "AMZN": np.array([1.3, 0.9, -0.2, -0.2, 0.6, 1.2, 0.4]),

    "VOO": np.array([1.0, 0.6, -0.1, 0.0, 0.3, 0.9, 0.2]),
    "SPY": np.array([1.0, 0.6, -0.1, 0.0, 0.3, 0.9, 0.2]),

    # Bonds - reduced sensitivity to equity drops
    "BND": np.array([0.1, -0.05, 0.2, 0.1, 0.0, 0.0, 0.0]),
    "AGG": np.array([0.1, -0.03, 0.15, 0.05, 0.0, 0.0, 0.0]),
    "TLT": np.array([0.0, -0.02, 0.2, 0.1, 0.0, 0.0, 0.0]),
    "VTIVX": np.array([0.0, -0.01, 0.1, 0.05, 0.0, 0.0, 0.0]),
    "VXUS": np.array([0.9, 0.5, -0.1, 0.0, 0.4, 0.8, 0.1]),

    # Commodities
    "GLD": np.array([0.0, 0.0, 1.3, 0.5, 0.0, 0.0, 0.0]),
    "SLV": np.array([0.0, 0.0, 1.1, 0.4, 0.0, 0.0, 0.0]),
    "USO": np.array([0.0, 0.0, 0.9, 0.3, 0.0, 0.0, 0.0]),
    "DBC": np.array([0.1, 0.0, 1.0, 0.3, 0.0, 0.0, 0.0]),

    # Cash & USD
    "CASH": np.zeros(7),
    "USD": np.zeros(7),

    # Crypto
    "BTC": np.array([2.0, 1.8, 0.0, 0.1, 0.2, 1.3, 0.8]),
    "ETH": np.array([2.2, 1.7, 0.0, 0.2, 0.3, 1.4, 0.7]),
    "SOL": np.array([2.5, 1.9, 0.1, 0.3, 0.4, 1.6, 0.9]),
}