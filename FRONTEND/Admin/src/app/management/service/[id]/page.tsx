"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiCall } from "@/lib/api-client";

interface Address {
  doorno?: string | null;
  street?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
}

interface ServiceTask {
  _id: string;
  task_id: number;
  customer_name: string;
  address: Address;
  phone: string;
  email: string;
  service_type: number;
  model_id: string;
  model_name: string;
  distributor_id: string;
  distributor_name: string;
  local_distributor_id: string;
  local_distributor_name: string;
  assigned_to: string | null;
  engineer_name: string | null;
  assigned_by: string | null;
  assigned_time: string | null;
  task_history: any[];
  created_by: string;
  created_time: string;
  modified_by: string | null;
  modified_time: string | null;
  status: boolean;
  task_status: string;
  completion_photos_urls?: string[];
}

const taskStatusMap: { [key: string]: string } = {
  created: "Created",
  assigned: "Assigned",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function ViewServiceTask() {
  const router = useRouter();
  const params = useParams();
  const taskId = params?.id as string;

  const [task, setTask] = useState<ServiceTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (taskId) {
      fetchTaskDetail();
    }
  }, [taskId]);

  const fetchTaskDetail = async () => {
    if (!taskId) {
      setError("Invalid task ID");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await apiCall<ServiceTask>(`/api/admin/tasks/${taskId}`);
      setTask(data);
    } catch (err) {
      console.error("Failed to fetch task details:", err);
      setError("Failed to load task details. Invalid task ID.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-dark dark:text-white">Loading...</p>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-red-500 mb-4">{error || "Task not found"}</p>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-opacity-90"
        >
          Go Back
        </button>
      </div>
    );
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-[#219653]/[0.08] text-[#219653]";
      case "assigned":
        return "bg-[#0288D1]/[0.08] text-[#0288D1]";
      case "in_progress":
        return "bg-[#FFA500]/[0.08] text-[#FFA500]";
      default:
        return "bg-[#999999]/[0.08] text-[#999999]";
    }
  };

  const formatAddress = () => {
    if (!task.address) return "N/A";
    const parts = [];
    if (task.address.doorno) parts.push(task.address.doorno);
    if (task.address.street) parts.push(task.address.street);
    if (task.address.city) parts.push(task.address.city);
    if (task.address.state) parts.push(task.address.state);
    if (task.address.pincode) parts.push(task.address.pincode);
    return parts.length > 0 ? parts.join(", ") : "N/A";
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-body-1xlg font-bold text-dark dark:text-white">
          SERVICE TASK DETAILS
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
            Task Information
          </h2>

          <div className="grid grid-cols-4 gap-6">
            <div>
              <label className="text-base font-semibold text-dark dark:text-white">
                Task ID
              </label>
              <p className="mt-2 text-dark dark:text-white">{task.task_id}</p>
            </div>

            <div>
              <label className="text-base font-semibold text-dark dark:text-white">
                Status
              </label>
              <div className="mt-2">
                <span
                  className={`inline-flex rounded-full px-3.5 py-1 text-sm font-normal ${getStatusBadgeColor(
                    task.task_status
                  )}`}
                >
                  {taskStatusMap[task.task_status] || task.task_status}
                </span>
              </div>
            </div>

            <div>
              <label className="text-base font-semibold text-dark dark:text-white">
                Created By
              </label>
              <p className="mt-2 text-dark dark:text-white">
                {task.created_by || "N/A"}
              </p>
            </div>

            <div>
              <label className="text-base font-semibold text-dark dark:text-white">
                Created At
              </label>
              <p className="mt-2 text-dark dark:text-white">
                {new Date(task.created_time).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[10px] bg-white px-7.5 pb-7.5 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card">
          <h2 className="mb-6 text-body-lg font-bold text-dark dark:text-white">
            Customer Information
          </h2>

          <div className="grid grid-cols-4 gap-6">
            <div>
              <label className="text-base font-semibold text-dark dark:text-white">
                Customer Name
              </label>
              <p className="mt-2 text-dark dark:text-white">
                {task.customer_name}
              </p>
            </div>

            <div>
              <label className="text-base font-semibold text-dark dark:text-white">
                Email
              </label>
              <p className="mt-2 text-dark dark:text-white">{task.email}</p>
            </div>

            <div>
              <label className="text-base font-semibold text-dark dark:text-white">
                Phone
              </label>
              <p className="mt-2 text-dark dark:text-white">{task.phone}</p>
            </div>

            <div>
              <label className="text-base font-semibold text-dark dark:text-white">
                Address
              </label>
              <p className="mt-2 text-dark dark:text-white">
                {formatAddress()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[10px] bg-white px-7.5 pb-7.5 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card">
          <h2 className="mb-6 text-body-lg font-bold text-dark dark:text-white">
            Model & Distributor Information
          </h2>

          <div className="grid grid-cols-4 gap-6">
            <div>
              <label className="text-base font-semibold text-dark dark:text-white">
                Model Name
              </label>
              <p className="mt-2 text-dark dark:text-white">
                {task.model_name}
              </p>
            </div>

            <div>
              <label className="text-base font-semibold text-dark dark:text-white">
                Distributor
              </label>
              <p className="mt-2 text-dark dark:text-white">
                {task.distributor_name}
              </p>
            </div>

            <div>
              <label className="text-base font-semibold text-dark dark:text-white">
                Local Distributor
              </label>
              <p className="mt-2 text-dark dark:text-white">
                {task.local_distributor_name}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[10px] bg-white px-7.5 pb-7.5 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card">
          <h2 className="mb-6 text-body-lg font-bold text-dark dark:text-white">
            Assignment Information
          </h2>

          <div className="grid grid-cols-4 gap-6">
            <div>
              <label className="text-base font-semibold text-dark dark:text-white">
                Assigned To
              </label>
              <p className="mt-2 text-dark dark:text-white">
                {task.assigned_to || "Not Assigned"}
              </p>
            </div>

            <div>
              <label className="text-base font-semibold text-dark dark:text-white">
                Engineer Name
              </label>
              <p className="mt-2 text-dark dark:text-white">
                {task.engineer_name || "N/A"}
              </p>
            </div>

            <div>
              <label className="text-base font-semibold text-dark dark:text-white">
                Assigned By
              </label>
              <p className="mt-2 text-dark dark:text-white">
                {task.assigned_by || "N/A"}
              </p>
            </div>

            <div>
              <label className="text-base font-semibold text-dark dark:text-white">
                Assigned Time
              </label>
              <p className="mt-2 text-dark dark:text-white">
                {task.assigned_time
                  ? new Date(task.assigned_time).toLocaleString()
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {task.task_status === "completed" && task.completion_photos_urls && task.completion_photos_urls.length > 0 && (
          <div className="rounded-[10px] bg-white px-7.5 pb-7.5 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card">
            <h2 className="mb-6 text-body-lg font-bold text-dark dark:text-white">
              Completion Photos
            </h2>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {task.completion_photos_urls.map((photoUrl, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-lg border border-[#E8E8E8] dark:border-dark-3"
                >
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${photoUrl}`}
                    alt={`Completion photo ${index + 1}`}
                    className="h-48 w-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {task.task_history && task.task_history.length > 0 && (
          <div className="rounded-[10px] bg-white px-7.5 pb-7.5 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card">
            <h2 className="mb-6 text-body-lg font-bold text-dark dark:text-white">
              Task History
            </h2>

            <div className="space-y-4">
              {task.task_history.map((history, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-[#E8E8E8] bg-gray-50 p-4 dark:border-dark-3 dark:bg-dark-2"
                >
                  <div className="grid grid-cols-4 gap-6">
                    <div>
                      <label className="text-sm font-semibold text-dark dark:text-white">
                        Action
                      </label>
                      <p className="mt-1 text-dark dark:text-white capitalize">
                        {history.action}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-dark dark:text-white">
                        From
                      </label>
                      <p className="mt-1 text-dark dark:text-white">
                        {history.from_name || "N/A"}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-dark dark:text-white">
                        To
                      </label>
                      <p className="mt-1 text-dark dark:text-white">
                        {history.to_name || "N/A"}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-dark dark:text-white">
                        Timestamp
                      </label>
                      <p className="mt-1 text-dark dark:text-white">
                        {new Date(history.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {history.assigned_by && (
                    <div className="mt-3 border-t border-[#E8E8E8] pt-3 dark:border-dark-3">
                      <label className="text-sm font-semibold text-dark dark:text-white">
                        Assigned By
                      </label>
                      <p className="mt-1 text-dark dark:text-white">
                        {history.assigned_by}
                      </p>
                    </div>
                  )}

                  {history.reason && (
                    <div className="mt-3 border-t border-[#E8E8E8] pt-3 dark:border-dark-3">
                      <label className="text-sm font-semibold text-dark dark:text-white">
                        Reason
                      </label>
                      <p className="mt-1 text-dark dark:text-white">
                        {history.reason}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
