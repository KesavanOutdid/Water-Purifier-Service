"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiCall } from "@/lib/api-client";
import Swal from "sweetalert2";

interface Address {
  doorno: string;
  street: string;
  city: string;
  district: string;
  state: string;
  country: string;
  pincode: string;
}

interface UserDetail {
  _id: string;
  user_id: string;
  name: string;
  email: string;
  number: string;
  password: string;
  roles: number[];
  role_names: string[];
  status: boolean;
  address: Address;
  distributor?: string;
  distributor_name?: string;
  local_distributor?: string | null;
  local_distributor_name?: string | null;
  created_by: string;
  created_at: string;
  modified_by: string | null;
  modified_at: string | null;
}

interface TaskAction {
  action: string;
  from?: string | null;
  from_name?: string | null;
  to?: string | null;
  to_name?: string | null;
  engineer_id?: string;
  engineer_name?: string;
  assigned_by?: string;
  timestamp: string;
  reason?: string | null;
}

interface EngineerTask {
  task_id: number;
  customer_name: string;
  service_type: number;
  current_status: string;
  actions: TaskAction[];
}

interface EngineerHistory {
  success: boolean;
  data: EngineerTask[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export default function ViewUser() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [engineerHistory, setEngineerHistory] = useState<EngineerTask[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserDetail();
    }
  }, [userId]);

  useEffect(() => {
    if (user && user.role_names?.includes("Service Engineer")) {
      fetchEngineerHistory();
    }
  }, [user]);

  const fetchUserDetail = async () => {
    if (!userId) {
      setError("Invalid user ID");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await apiCall<UserDetail>(`/api/admin/users/${userId}`);
      console.log("User data received:", data);
      setUser(data);
    } catch (err) {
      console.error("Failed to fetch user details:", err);
      setError("Failed to load user details. Invalid user ID or user not found.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!user) return;

    try {
      setIsUpdatingStatus(true);
      const newStatus = !user.status;

      await apiCall(`/api/admin/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          roles: user.roles,
          number: user.number,
          status: newStatus,
          address: user.address,
        }),
      });

      setUser({ ...user, status: newStatus });
      Swal.fire("Success", `User status changed to ${newStatus ? "Active" : "Inactive"}`, "success");
    } catch (error) {
      console.error("Failed to update status:", error);
      Swal.fire("Error", "Failed to update user status", "error");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const fetchEngineerHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await apiCall<EngineerHistory>(`/api/admin/engineers/${userId}/history`, {}, true);
      
      if (response && response.data && Array.isArray(response.data)) {
        setEngineerHistory(response.data);
      } else {
        setEngineerHistory([]);
      }
    } catch (error) {
      console.error("Failed to fetch engineer history:", error);
      setEngineerHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-dark dark:text-white">Loading...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-red-500 mb-4">{error || "User not found"}</p>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-opacity-90"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-body-1xlg font-bold text-dark dark:text-white">
          USER DETAILS
        </h1>
        <div className="flex gap-3">
         
          <button
            onClick={() => router.back()}
            className="inline-flex items-center justify-center rounded-lg bg-gray-300 px-5 py-2 text-sm font-medium text-dark hover:bg-gray-400 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-700"
          >
            Back
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="rounded-[10px] bg-white px-7.5 pb-7.5 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card">
          <h2 className="mb-6 text-body-lg font-bold text-dark dark:text-white">
            User Information
          </h2>

          <div className="grid grid-cols-4 gap-6">
            <div>
              <label className="text-base font-semibold text-dark dark:text-white">
                Full Name
              </label>
              <p className="mt-2 text-base text-dark dark:text-white">
                {user.name}
              </p>
            </div>

            <div>
              <label className="text-base font-semibold text-dark dark:text-white">
                Email
              </label>
              <p className="mt-2 text-base text-dark dark:text-white">
                {user.email}
              </p>
            </div>

            <div>
              <label className="text-base font-semibold text-dark dark:text-white">
                Phone
              </label>
              <p className="mt-2 text-base text-dark dark:text-white">
                {user.number || "N/A"}
              </p>
            </div>

            <div>
              <label className="text-base font-semibold text-dark dark:text-white">
                Password
              </label>
              <p className="mt-2 text-base text-dark dark:text-white">
                {user.password || "N/A"}
              </p>
            </div>

            <div>
              <label className="text-base font-semibold text-dark dark:text-white">
                Role
              </label>
              <p className="mt-2 text-base text-dark dark:text-white">
                {user.role_names?.join(", ") || "N/A"}
              </p>
            </div>

            <div>
              <label className="text-base font-semibold text-dark dark:text-white">
                Status
              </label>
              <div className="mt-2 flex items-center gap-3">
                <span
                  className={`inline-flex rounded-full px-3.5 py-1 text-base font-normal ${
                    user.status
                      ? "bg-[#219653]/[0.08] text-[#219653]"
                      : "bg-[#DC3545]/[0.08] text-[#DC3545]"
                  }`}
                >
                  {user.status ? "Active" : "Inactive"}
                </span>
               
              </div>
            </div>

            {user.distributor_name && (
              <div>
                <label className="text-base font-semibold text-dark dark:text-white">
                  Distributor
                </label>
                <p className="mt-2 text-base text-dark dark:text-white">
                  {user.distributor_name || "N/A"}
                </p>
              </div>
            )}

            {user.local_distributor_name && (
              <div>
                <label className="text-base font-semibold text-dark dark:text-white">
                  Local Distributor
                </label>
                <p className="mt-2 text-base text-dark dark:text-white">
                  {user.local_distributor_name || "N/A"}
                </p>
              </div>
            )}

            <div>
              <label className="text-base font-semibold text-dark dark:text-white">
                Created Date
              </label>
              <p className="mt-2 text-base text-dark dark:text-white">
                {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {user.address && (
          <div className="rounded-[10px] bg-white px-7.5 pb-7.5 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card">
            <h2 className="mb-6 text-body-lg font-bold text-dark dark:text-white">
              Address
            </h2>

            <div className="rounded-lg border border-stroke p-5 dark:border-dark-3">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="text-base font-semibold text-dark dark:text-white">
                    Door Number
                  </label>
                  <p className="mt-1 text-base text-dark dark:text-white">
                    {user.address.doorno || "N/A"}
                  </p>
                </div>

                <div>
                  <label className="text-base font-semibold text-dark dark:text-white">
                    Street
                  </label>
                  <p className="mt-1 text-base text-dark dark:text-white">
                    {user.address.street || "N/A"}
                  </p>
                </div>

                <div>
                  <label className="text-base font-semibold text-dark dark:text-white">
                    City
                  </label>
                  <p className="mt-1 text-base text-dark dark:text-white">
                    {user.address.city || "N/A"}
                  </p>
                </div>

                <div>
                  <label className="text-base font-semibold text-dark dark:text-white">
                    District
                  </label>
                  <p className="mt-1 text-base text-dark dark:text-white">
                    {user.address.district || "N/A"}
                  </p>
                </div>

                <div>
                  <label className="text-base font-semibold text-dark dark:text-white">
                    State
                  </label>
                  <p className="mt-1 text-base text-dark dark:text-white">
                    {user.address.state || "N/A"}
                  </p>
                </div>

                <div>
                  <label className="text-base font-semibold text-dark dark:text-white">
                    Country
                  </label>
                  <p className="mt-1 text-base text-dark dark:text-white">
                    {user.address.country || "N/A"}
                  </p>
                </div>

                <div>
                  <label className="text-base font-semibold text-dark dark:text-white">
                    Pincode
                  </label>
                  <p className="mt-1 text-base text-dark dark:text-white">
                    {user.address.pincode || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {user.role_names?.includes("Service Engineer") && (
          <div className="rounded-[10px] bg-white px-7.5 pb-7.5 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card">
            <h2 className="mb-6 text-body-lg font-bold text-dark dark:text-white">
              Engineer Task History
            </h2>

            {historyLoading ? (
              <p className="text-dark dark:text-white">Loading history...</p>
            ) : engineerHistory.length === 0 ? (
              <p className="text-dark dark:text-white">No task history available</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-[#E8E8E8] dark:border-dark-3">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-dark dark:text-white">
                        Task ID
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-dark dark:text-white">
                        Customer
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-dark dark:text-white">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-dark dark:text-white">
                        Status
                      </th>
                     
                      <th className="px-4 py-3 text-left text-sm font-semibold text-dark dark:text-white">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-dark dark:text-white">
                        Reason
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {engineerHistory.map((task, taskIndex) => {
                      const latestAction = task.actions && task.actions.length > 0 ? task.actions[task.actions.length - 1] : null;
                      
                      return (
                        <tr
                          key={taskIndex}
                          className="border-b border-[#E8E8E8] hover:bg-gray-50 dark:border-dark-3 dark:hover:bg-dark-2"
                        >
                          <td className="px-4 py-4 text-sm text-dark dark:text-white">
                            {task.task_id}
                          </td>
                          <td className="px-4 py-4 text-sm text-dark dark:text-white">
                            {task.customer_name}
                          </td>
                          <td className="px-4 py-4 text-sm text-dark dark:text-white">
                            <span className={
                              task.service_type === 1
                                ? "text-blue-800 dark:text-blue-200"
                                : "text-green-800 dark:text-green-200"
                            }>
                              {task.service_type === 1 ? "Installation" : "Service"}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-dark dark:text-white">
                            <span className={`capitalize ${
                              task.current_status === "accepted"
                                ? "text-green-800 dark:text-green-200"
                                : task.current_status === "rejected"
                                ? "text-red-800 dark:text-red-200"
                                : "text-yellow-800 dark:text-yellow-200"
                            }`}>
                              {task.current_status}
                            </span>
                          </td>
                       
                          <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                            {latestAction && new Date(latestAction.timestamp).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                            {latestAction?.reason && (
                              <span className="max-w-xs truncate inline-block" title={latestAction.reason}>
                                {latestAction.reason}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
