"use client";

import { useState } from "react";
import { useDashboard } from "../_hooks/useDashboard";

type TimeFrame = "today" | "week" | "month" | "year";

export function EngineersCard() {
  const { data, isLoading } = useDashboard();
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("week");

  if (isLoading || !data) {
    return (
      <div className="h-[300px] animate-pulse rounded-[10px] bg-gray-200 dark:bg-gray-700" />
    );
  }

  const engineerKey = `${timeFrame}_top_5_engineers` as const;
  const engineers = data?.[engineerKey] || [];

  return (
    <div className="h-[400px] flex flex-col rounded-[10px] bg-white shadow-1 dark:bg-gray-dark">
      <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-heading-7 font-bold text-dark dark:text-white">
            Top Engineers
          </h3>
          <select
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value as TimeFrame)}
            className="rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-green-100 dark:bg-green-900">
              <th className="px-4 py-3 text-left">
                <span className="text-sm text-black-100 dark:text-green-100">
                  Name
                </span>
              </th>
              <th className="px-4 py-3 text-center">
                <span className="text-sm text-black-100 dark:text-green-100">
                  Total Tasks
                </span>
              </th>
              <th className="px-4 py-3 text-center">
                <span className="text-sm text-black-100 dark:text-green-100">
                  Completed
                </span>
              </th>
              <th className="px-4 py-3 text-center">
                <span className="text-sm text-black-100 dark:text-green-100">
                  Rate
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {engineers.map((engineer) => {
              const completionRate =
                engineer.total_tasks > 0
                  ? Math.round(
                      (engineer.completed_tasks / engineer.total_tasks) *
                        100
                    )
                  : 0;

              return (
                <tr
                  key={engineer.user_id}
                  className="border-b border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  <td className="px-4 py-3">
                    <span className="text-sm text-dark dark:text-white">
                      {engineer.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm text-dark dark:text-white">
                      {engineer.total_tasks}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block rounded-full bg-green-100 px-2 py-1 text-xs text-green-700 dark:bg-green-900 dark:text-green-200">
                      {engineer.completed_tasks}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="w-16">
                        <div className="h-1.5 w-full rounded-full bg-gray-300 dark:bg-gray-600">
                          <div
                            className="h-1.5 rounded-full bg-green-500 transition-all duration-300"
                            style={{ width: `${completionRate}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-medium text-dark dark:text-white">
                        {completionRate}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
