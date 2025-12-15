"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiCall } from "@/lib/api-client";
import Swal from "sweetalert2";

interface ModelDetail {
  _id: string;
  uid: string;
  name: string;
  quantity: number;
  created_by: string;
  created_time: string;
  modified_by: string | null;
  modified_time: string | null;
  status: boolean;
}

export default function ViewModel() {
  const router = useRouter();
  const params = useParams();
  const modelId = params?.id as string;

  const [model, setModel] = useState<ModelDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (modelId) {
      fetchModelDetail();
    }
  }, [modelId]);

  const fetchModelDetail = async () => {
    if (!modelId) {
      setError("Invalid model ID");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await apiCall<ModelDetail>(`/api/admin/models/${modelId}`);
      console.log("Model data received:", data);
      setModel(data);
    } catch (err) {
      console.error("Failed to fetch model details:", err);
      setError("Failed to load model details. Invalid model ID or model not found.");
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

  if (error || !model) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-red-500 mb-4">{error || "Model not found"}</p>
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
          MODEL DETAILS
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
            Model Information
          </h2>

          <div className="grid grid-cols-4 gap-6">
            <div>
              <label className="text-base font-semibold text-dark dark:text-white">
                Model Name
              </label>
              <p className="mt-2 text-base text-dark dark:text-white">
                {model.name}
              </p>
            </div>

            <div>
              <label className="text-base font-semibold text-dark dark:text-white">
                Quantity
              </label>
              <p className="mt-2 text-base text-dark dark:text-white">
                {model.quantity}
              </p>
            </div>

            <div>
              <label className="text-base font-semibold text-dark dark:text-white">
                Created By
              </label>
              <p className="mt-2 text-base text-dark dark:text-white">
                {model.created_by}
              </p>
            </div>

            <div>
              <label className="text-base font-semibold text-dark dark:text-white">
                Status
              </label>
              <p className="mt-2">
                <span
                  className={`inline-flex rounded-full px-3.5 py-1 text-base font-normal ${
                    model.status
                      ? "bg-[#219653]/[0.08] text-[#219653]"
                      : "bg-[#DC3545]/[0.08] text-[#DC3545]"
                  }`}
                >
                  {model.status ? "Active" : "Inactive"}
                </span>
              </p>
            </div>

            <div>
              <label className="text-base font-semibold text-dark dark:text-white">
                Created Date
              </label>
              <p className="mt-2 text-base text-dark dark:text-white">
                {new Date(model.created_time).toLocaleDateString()} {new Date(model.created_time).toLocaleTimeString()}
              </p>
            </div>

            <div>
              <label className="text-base font-semibold text-dark dark:text-white">
                UID
              </label>
              <p className="mt-2 text-base text-dark dark:text-white break-all">
                {model.uid}
              </p>
            </div>

            {model.modified_time && (
              <div>
                <label className="text-base font-semibold text-dark dark:text-white">
                  Last Modified
                </label>
                <p className="mt-2 text-base text-dark dark:text-white">
                  {new Date(model.modified_time).toLocaleDateString()} {new Date(model.modified_time).toLocaleTimeString()}
                </p>
              </div>
            )}

            {model.modified_by && (
              <div>
                <label className="text-base font-semibold text-dark dark:text-white">
                  Modified By
                </label>
                <p className="mt-2 text-base text-dark dark:text-white">
                  {model.modified_by}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
