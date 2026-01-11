export const normalizePortfolio = (
  assets: { [ticker: string]: number },
  cash: number
) => {
  const total =
    Object.values(assets).reduce((a, b) => a + b, 0) + cash;

  if (total === 0) {
    return { assets: {}, cash: 0 };
  }

  const normalizedAssets = Object.fromEntries(
    Object.entries(assets).map(([t, w]) => [
      t,
      (w / total) * 100,
    ])
  );

  const normalizedCash = (cash / total) * 100;

  return { assets: normalizedAssets, cash: normalizedCash };
};
