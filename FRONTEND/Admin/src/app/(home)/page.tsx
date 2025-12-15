"use client";

import { PaymentsOverview } from "@/components/Charts/payments-overview";
import { UsedDevices } from "@/components/Charts/used-devices";
import { WeeksProfit } from "@/components/Charts/weeks-profit";
import { TopChannels } from "@/components/Tables/top-channels";
import { TopChannelsSkeleton } from "@/components/Tables/top-channels/skeleton";
import { Suspense } from "react";
import { ChatsCard } from "./_components/chats-card";
import { OverviewCardsSkeleton } from "./_components/overview-cards/skeleton";
import { RegionLabels } from "./_components/region-labels";
import { DashboardOverviewCards } from "./_components/overview-cards/dashboard-cards";
import { DistributorsCard } from "./_components/distributors-card";
import { LocalDistributorsCard } from "./_components/local-distributors-card";
import { EngineersCard } from "./_components/engineers-card";
import { useDashboard } from "./_hooks/useDashboard";

export default function Home() {
  const { data, isLoading } = useDashboard();

  const hasDistributors = (data?.week_top_5_distributors?.length ?? 0) > 0;
  const hasLocalDistributors = (data?.week_top_5_local_distributors?.length ?? 0) > 0;
  const hasEngineers = (data?.week_top_5_engineers?.length ?? 0) > 0;

  return (
    <>
      <Suspense fallback={<OverviewCardsSkeleton />}>
        <DashboardOverviewCards />
      </Suspense>

      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-9 2xl:gap-7.5">
        {(hasDistributors || hasLocalDistributors) && (
          <div className="col-span-12 grid grid-cols-12 gap-4 md:gap-6">
            {hasDistributors && (
              <div className="col-span-12 xl:col-span-6">
                <DistributorsCard />
              </div>
            )}

            {hasLocalDistributors && (
              <div className={hasDistributors ? "col-span-12 xl:col-span-6" : "col-span-12"}>
                <LocalDistributorsCard />
              </div>
            )}
          </div>
        )}

        {hasEngineers && (
          <div className="col-span-12">
            <EngineersCard />
          </div>
        )}
      </div>
    </>
  );
}
