"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth";
import { apiCall } from "@/lib/api-client";

interface DashboardData {
  role: string;
  total_roles?: number;
  total_users?: number;
  total_tasks?: number;
  total_tasks_completed?: number;
  total_devices: number;
  active_models: number;
  today_tasks?: number;
  week_tasks?: number;
  month_tasks?: number;
  year_tasks?: number;
  total_users_under?: number;
  total_tasks_under?: number;
  completed_tasks_under?: number;
  today_top_5_distributors?: Array<{
    user_id: string;
    name: string;
    total_tasks: number;
    completed_tasks: number;
  }>;
  week_top_5_distributors?: Array<{
    user_id: string;
    name: string;
    total_tasks: number;
    completed_tasks: number;
  }>;
  month_top_5_distributors?: Array<{
    user_id: string;
    name: string;
    total_tasks: number;
    completed_tasks: number;
  }>;
  year_top_5_distributors?: Array<{
    user_id: string;
    name: string;
    total_tasks: number;
    completed_tasks: number;
  }>;
  today_top_5_local_distributors?: Array<{
    user_id: string;
    name: string;
    total_tasks: number;
    completed_tasks: number;
  }>;
  week_top_5_local_distributors?: Array<{
    user_id: string;
    name: string;
    total_tasks: number;
    completed_tasks: number;
  }>;
  month_top_5_local_distributors?: Array<{
    user_id: string;
    name: string;
    total_tasks: number;
    completed_tasks: number;
  }>;
  year_top_5_local_distributors?: Array<{
    user_id: string;
    name: string;
    total_tasks: number;
    completed_tasks: number;
  }>;
  today_top_5_engineers?: Array<{
    user_id: string;
    name: string;
    total_tasks: number;
    completed_tasks: number;
  }>;
  week_top_5_engineers?: Array<{
    user_id: string;
    name: string;
    total_tasks: number;
    completed_tasks: number;
  }>;
  month_top_5_engineers?: Array<{
    user_id: string;
    name: string;
    total_tasks: number;
    completed_tasks: number;
  }>;
  year_top_5_engineers?: Array<{
    user_id: string;
    name: string;
    total_tasks: number;
    completed_tasks: number;
  }>;
}

const cacheMap = new Map<string, DashboardData>();
const promiseMap = new Map<string, Promise<DashboardData>>();

export function useDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.user_id) {
        setData(null);
        setIsLoading(false);
        return;
      }

      const userId = user.user_id;

      if (cacheMap.has(userId)) {
        setData(cacheMap.get(userId) || null);
        setIsLoading(false);
        return;
      }

      if (!promiseMap.has(userId)) {
        promiseMap.set(
          userId,
          apiCall<DashboardData>(
            `/api/admin/dashboard?user_id=${userId}`,
            { method: "GET" }
          )
        );
      }

      try {
        const dashboardData = await promiseMap.get(userId)!;
        cacheMap.set(userId, dashboardData);
        setData(dashboardData);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.user_id]);

  return { data, isLoading };
}
