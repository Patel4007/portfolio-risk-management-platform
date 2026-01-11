export default function StockList({ onSelect }: { onSelect: (ticker: string) => void }) {
  const stocks = ["AAPL","MSFT","GOOG","AMZN","NVDA","META","TSLA","NFLX","AMD","SHOP"];

  return (
    <div className="flex flex-col gap-1 p-2 border-r h-screen w-[120px]">
      {stocks.map(s => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className="text-xs p-2 rounded-lg hover:bg-gray-100 text-left">
          {s}
        </button>
      ))}
    </div>
  );
}