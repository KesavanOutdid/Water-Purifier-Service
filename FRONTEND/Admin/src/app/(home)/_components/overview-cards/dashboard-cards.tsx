"use client";

import { compactFormat } from "@/lib/format-number";
import { OverviewCard } from "./card";
import * as icons from "./icons";
import { useDashboard } from "../../_hooks/useDashboard";

export function DashboardOverviewCards() {
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-5 2xl:gap-7.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-[160px] animate-pulse rounded-[10px] bg-gray-200 dark:bg-gray-700"
          />
        ))}
      </div>
    );
  }

  const cardCount = [
    data?.total_roles !== undefined,
    data?.total_users !== undefined,
    data?.total_tasks !== undefined,
    data?.total_devices !== undefined,
    data?.active_models !== undefined,
  ].filter(Boolean).length;

  const colsClass = cardCount === 2 ? 'xl:grid-cols-2' : cardCount === 3 ? 'xl:grid-cols-3' : cardCount === 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-5';

  return (
    <div className={`grid gap-4 sm:grid-cols-2 sm:gap-6 ${colsClass} 2xl:gap-7.5`}>
      {data?.total_roles !== undefined && (
        <OverviewCard
          label="Total Roles"
          data={{
            value: compactFormat(data.total_roles || 0),
            growthRate: 0,
          }}
          Icon={icons.Users}
        />
      )}

      {data?.total_users !== undefined && (
        <OverviewCard
          label="Total Users"
          data={{
            value: compactFormat(data.total_users || 0),
            growthRate: 0,
          }}
          Icon={icons.Views}
        />
      )}

      {data?.total_tasks !== undefined && (
        <OverviewCard
          label="Total Tasks"
          data={{
            value: compactFormat(data.total_tasks || 0),
            growthRate: 0,
          }}
          Icon={icons.Profit}
        />
      )}

      {data?.total_devices !== undefined && (
        <OverviewCard
          label="Total Devices"
          data={{
            value: compactFormat(data.total_devices),
            growthRate: 0,
          }}
          Icon={icons.Product}
        />
      )}

      {data?.active_models !== undefined && (
        <OverviewCard
          label="Active Models"
          data={{
            value: compactFormat(data.active_models),
            growthRate: 0,
          }}
          Icon={icons.Product}
        />
      )}
    </div>
  );
}
