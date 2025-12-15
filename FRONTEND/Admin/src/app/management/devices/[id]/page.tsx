"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiCall } from "@/lib/api-client";

interface Device {
  _id: string;
  device_id: string;
  model_id: string;
  name: string;
  created_by: string;
  created_time: string;
  modified_by: string | null;
  modified_time: string | null;
  status: boolean;
  assignment_history: any[];
}

export default function ViewDevice() {
  const router = useRouter();
  const params = useParams();
  const deviceId = params?.id as string;

  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (deviceId) {
      fetchDevice();
    }
  }, [deviceId]);

  const fetchDevice = async () => {
    if (!deviceId) {
      setError("Invalid device ID");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await apiCall<Device>(`/api/admin/devices/${deviceId}`, {}, true) as any;
      
      if (response && response.data) {
        setDevice(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch device:", error);
      setError("Failed to load device details. Invalid device ID.");
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

  if (error || !device) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-red-500 mb-4">{error || "Device not found"}</p>
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
          DEVICE DETAILS
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
            Device Information
          </h2>

          <div className="grid grid-cols-4 gap-6">
            <div>
              <label className="text-base font-semibold text-dark dark:text-white">
                Device ID
              </label>
              <p className="mt-2 text-dark dark:text-white">{device.device_id}</p>
            </div>

            <div>
              <label className="text-base font-semibold text-dark dark:text-white">
                Model ID
              </label>
              <p className="mt-2 text-dark dark:text-white">{device.model_id}</p>
            </div>

            <div>
              <label className="text-base font-semibold text-dark dark:text-white">
                Name
              </label>
              <p className="mt-2 text-dark dark:text-white">{device.name}</p>
            </div>

            <div>
              <label className="text-base font-semibold text-dark dark:text-white">
                Status
              </label>
              <div className="mt-2">
                <span
                  className={`inline-flex rounded-full px-3.5 py-1 text-sm font-normal ${
                    device.status
                      ? "bg-[#219653]/[0.08] text-[#219653]"
                      : "bg-[#DC3545]/[0.08] text-[#DC3545]"
                  }`}
                >
                  {device.status ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            <div>
              <label className="text-base font-semibold text-dark dark:text-white">
                Created By
              </label>
              <p className="mt-2 text-dark dark:text-white">
                {device.created_by || "N/A"}
              </p>
            </div>

            <div>
              <label className="text-base font-semibold text-dark dark:text-white">
                Created Time
              </label>
              <p className="mt-2 text-dark dark:text-white">
                {new Date(device.created_time).toLocaleString()}
              </p>
            </div>

            {device.modified_by && (
              <div>
                <label className="text-base font-semibold text-dark dark:text-white">
                  Modified By
                </label>
                <p className="mt-2 text-dark dark:text-white">{device.modified_by}</p>
              </div>
            )}

            {device.modified_time && (
              <div>
                <label className="text-base font-semibold text-dark dark:text-white">
                  Modified Time
                </label>
                <p className="mt-2 text-dark dark:text-white">
                  {new Date(device.modified_time).toLocaleString()}
                </p>
              </div>
            )}
          </div>

         
        </div>
      </div>
    </>
  );
}
