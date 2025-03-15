import React, { useState, useEffect } from "react";

const PastTrades = ({ userId }: { userId: string }) => {
  interface Trade {
    token: string;
    type: string;
    amount: number;
    price: number;
    date: string;
  }

  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPastTrades = async () => {
      try {
        const response = await fetch(`/api/trades?user=${userId}`);
        if (!response.ok) throw new Error("Failed to fetch past trades");
        const data = await response.json();
        setTrades(data.trades);
      } catch (err) {
        setError("Error fetching past trades.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPastTrades();
  }, [userId]);

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-semibold text-gray-800">Past Trades</h2>
      {loading ? (
        <p className="mt-4 text-gray-600">Loading past trades...</p>
      ) : error ? (
        <p className="mt-4 text-red-500">{error}</p>
      ) : trades.length === 0 ? (
        <p className="mt-4 text-gray-600">No past trades found.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse bg-white shadow-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-600">
                <th className="p-4 text-left">Token</th>
                <th className="p-4 text-left">Type</th>
                <th className="p-4 text-left">Amount</th>
                <th className="p-4 text-left">Price</th>
                <th className="p-4 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade, index) => (
                <tr key={index} className="border-b">
                  <td className="p-4">{trade.token}</td>
                  <td className={`p-4 font-medium ${trade.type === "buy" ? "text-green-500" : "text-red-500"}`}>
                    {trade.type.toUpperCase()}
                  </td>
                  <td className="p-4">{trade.amount}</td>
                  <td className="p-4">${trade.price}</td>
                  <td className="p-4">{new Date(trade.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PastTrades;
