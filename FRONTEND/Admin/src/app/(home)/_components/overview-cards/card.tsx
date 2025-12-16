import { ArrowDownIcon, ArrowUpIcon } from "@/assets/icons";
import { cn } from "@/lib/utils";
import type { JSX, SVGProps } from "react";

type PropsType = {
  label: string;
  data: {
    value: number | string;
    growthRate?: number;
  };
  Icon: (props: SVGProps<SVGSVGElement>) => JSX.Element;
};

export function OverviewCard({ label, data, Icon }: PropsType) {
  const isDecreasing = data.growthRate !== undefined && data.growthRate < 0;

  return (
    <div className="rounded-[10px] bg-white p-5 shadow-1 dark:bg-gray-dark">
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex-shrink-0">
            <Icon />
          </div>

          <dl>
            <dd className="text-sm font-medium text-dark-5">{label}</dd>
            <dt className="text-lg font-semibold text-dark dark:text-white">
              + {data.value}
            </dt>
          </dl>
        </div>

        {data.growthRate !== undefined && (
          <dl
            className={cn(
              "text-sm font-medium flex-shrink-0",
              isDecreasing ? "text-red" : "text-green",
            )}
          >
            <dt className="flex items-center gap-1">
              {data.growthRate}%
              {isDecreasing ? (
                <ArrowDownIcon aria-hidden />
              ) : (
                <ArrowUpIcon aria-hidden />
              )}
            </dt>
          </dl>
        )}
      </div>
    </div>
  );
}
