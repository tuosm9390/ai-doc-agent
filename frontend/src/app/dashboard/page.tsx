"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { HistoryItem } from "@/lib/types";

function scoreColor(v: number) {
  if (v >= 8) return "text-green-600";
  if (v >= 5) return "text-yellow-600";
  return "text-red-500";
}

export default function Dashboard() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("doc-history") ?? "[]");
    setHistory(stored);
  }, []);

  const chartData = [...history]
    .reverse()
    .map((item, i) => ({
      index: i + 1,
      score: item.result.scores.overall,
      label: item.topic.slice(0, 12),
    }));

  if (history.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 text-sm">아직 생성된 문서가 없습니다.</p>
        <a href="/" className="mt-3 inline-block text-sm text-gray-700 underline">
          첫 문서 만들기 →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold text-gray-900">Eval 대시보드</h1>

      {/* Trend chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <p className="text-xs font-medium text-gray-500 mb-4 uppercase tracking-wide">
          점수 추이
        </p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 10]}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                border: "1px solid #e5e7eb",
                borderRadius: 6,
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#111827"
              strokeWidth={2}
              dot={{ r: 3, fill: "#111827" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* History table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                주제
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                유형
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                종합
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden sm:table-cell">
                명확성
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden sm:table-cell">
                구조
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {history.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-900 max-w-xs truncate">
                  {item.topic}
                </td>
                <td className="px-4 py-3 text-gray-500">{item.doc_type}</td>
                <td className={`px-4 py-3 text-right font-semibold ${scoreColor(item.result.scores.overall)}`}>
                  {item.result.scores.overall}
                </td>
                <td className={`px-4 py-3 text-right hidden sm:table-cell ${scoreColor(item.result.scores.clarity)}`}>
                  {item.result.scores.clarity}
                </td>
                <td className={`px-4 py-3 text-right hidden sm:table-cell ${scoreColor(item.result.scores.structure)}`}>
                  {item.result.scores.structure}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
