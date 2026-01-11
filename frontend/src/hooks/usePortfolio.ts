import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { normalizePortfolio } from "./normalizePortfolio";

const [portfolio, setPortfolio] = useState<{[ticker: string]: number}>({
    AAPL: 40,
    GOOG: 30,
    TSLA: 20,
    AMZN: 10,
  });

const [tempWeights, setTempWeights] = useState<{[ticker: string]: number}>({ ...portfolio });

export const usePortfolio = () => {
  const [liquidCash, setLiquidCash] = useState(0);
  const [initialPortfolioValue, setInitialPortfolioValue] = useState(100000);

  const getUserId = async (): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  };

  const addStock = async (ticker: string) => {
    if (portfolio[ticker]) return;
  
    const newAssets = {
      ...portfolio,
      [ticker]: 5,
    };
  
    const { assets, cash } = normalizePortfolio(
      newAssets,
      liquidCash
    );
  
    setPortfolio(assets);
    setLiquidCash(cash);
    setTempWeights(assets);
  
    const userId = await getUserId();
    if (!userId) return;
  
    const rows = [
      ...Object.entries(assets).map(([t, w]) => ({
        user_id: userId,
        ticker: t,
        weight: w,
        updated_at: new Date().toISOString(),
      })),
      {
        user_id: userId,
        ticker: "CASH",
        weight: cash,
        updated_at: new Date().toISOString(),
      },
    ];
  
    await supabase
      .from("portfolio_assets")
      .upsert(rows, { onConflict: "user_id,ticker" });
  };

  const removeStock = async (ticker: string) => {
    if (!portfolio[ticker]) return;
  
    const newAssets = { ...portfolio };
    delete newAssets[ticker];
  
    const { assets, cash } = normalizePortfolio(
      newAssets,
      liquidCash
    );
  
    setPortfolio(assets);
    setLiquidCash(cash);
    setTempWeights(assets);
  
    const userId = await getUserId();
    if (!userId) return;
  
    await supabase
      .from("portfolio_assets")
      .delete()
      .eq("user_id", userId)
      .eq("ticker", ticker);
  
    const rows = [
      ...Object.entries(assets).map(([t, w]) => ({
        user_id: userId,
        ticker: t,
        weight: w,
        updated_at: new Date().toISOString(),
      })),
      {
        user_id: userId,
        ticker: "CASH",
        weight: cash,
        updated_at: new Date().toISOString(),
      },
    ];
  
    await supabase
      .from("portfolio_assets")
      .upsert(rows, { onConflict: "user_id,ticker" });
  };

  useEffect(() => {
    const loadPortfolio = async () => {
      const userId = await getUserId();
      if (!userId) return;
  
      const { data, error } = await supabase
        .from("portfolio_assets")
        .select("ticker, weight")
        .eq("user_id", userId);
  
      if (error || !data) return;
  
      const assets: { [k: string]: number } = {};
      let cash = 0;
  
      data.forEach(row => {
        if (row.ticker === "CASH") {
          cash = row.weight;
        } else {
          assets[row.ticker] = row.weight;
        }
      });
  
      setPortfolio(assets);
      setLiquidCash(cash);
    };
  
    loadPortfolio();
  }, []);

  return {
    portfolio,
    setPortfolio,
    liquidCash,
    setLiquidCash,
    initialPortfolioValue,
    setInitialPortfolioValue,
    addStock,
    removeStock,
  };
};
