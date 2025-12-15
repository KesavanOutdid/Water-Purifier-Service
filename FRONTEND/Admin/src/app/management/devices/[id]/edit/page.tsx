"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiCall } from "@/lib/api-client";
import { useAuth } from "@/context/auth";
import Swal from "sweetalert2";

interface Model {
  _id: string;
  uid: string;
  name: string;
  quantity: number;
  status: boolean;
}

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
}

interface DeviceFormData {
  device_id: string;
  model_id: string;
  status: boolean;
}

interface FormErrors {
  device_id?: string;
  model_id?: string;
}

export default function EditDevice() {
  const router = useRouter();
  const params = useParams();
  const deviceId = params?.id as string;
  const { user } = useAuth();

  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<DeviceFormData>({
    device_id: "",
    model_id: "",
  });

  useEffect(() => {
    if (deviceId) {
      fetchDevice();
      fetchModels();
    }
  }, [deviceId]);

  const fetchDevice = async () => {
    try {
      setLoading(true);
      const response = await apiCall<Device>(`/api/admin/devices/${deviceId}`, {}, true) as any;
      
      if (response && response.data) {
        const device = response.data;
        setFormData({
          device_id: device.device_id,
          model_id: device.model_id,
          status: device.status,
        });
      }
    } catch (error) {
      console.error("Failed to fetch device:", error);
      Swal.fire("Error", "Failed to load device", "error");
      router.push("/management/devices");
    } finally {
      setLoading(false);
    }
  };

  const fetchModels = async () => {
    try {
      const response = await apiCall<any>(`/api/admin/models?page=1&limit=100`, {}, true);
      
      if (response && response.data && Array.isArray(response.data)) {
        setModels(response.data);
      } else {
        setModels([]);
      }
    } catch (error) {
      console.error("Failed to fetch models:", error);
      setModels([]);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.device_id.trim()) {
      newErrors.device_id = "Device ID is required";
    } else if (formData.device_id.length > 50) {
      newErrors.device_id = "Device ID must be 50 characters or less";
    }

    if (!formData.model_id) {
      newErrors.model_id = "Model is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      Swal.fire("Error", "Please fix the validation errors", "error");
      return;
    }

    try {
      setSubmitting(true);
      await apiCall(`/api/admin/devices/${deviceId}`, {
        method: "PUT",
        body: JSON.stringify({
          device_id: formData.device_id,
          model_id: formData.model_id,
          status: formData.status,
          modified_by: user?.email || "",
        }),
      });

      Swal.fire("Success", "Device updated successfully", "success");
      router.push("/management/devices");
    } catch (error) {
      console.error("Failed to update device:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update device";
      Swal.fire("Error", errorMessage, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-dark dark:text-white">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-body-1xlg font-bold text-dark dark:text-white">
          EDIT DEVICE
        </h1>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center justify-center rounded-lg bg-gray-300 px-5 py-2 text-sm font-medium text-dark hover:bg-gray-400 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-700"
        >
          Back
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="rounded-[10px] bg-white px-7.5 pb-7.5 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card">
          <h2 className="mb-6 text-body-lg font-bold text-dark dark:text-white">
            Device Information
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-5.5 grid grid-cols-1 gap-5.5 sm:grid-cols-2">
              <div>
                <label className="text-base font-semibold text-dark dark:text-white">
                  Device ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="device_id"
                  value={formData.device_id}
                  onChange={handleChange}
                  placeholder="Enter device ID"
                  maxLength={50}
                  className={`mt-2 w-full rounded-lg border-[1.5px] bg-transparent px-5 py-3 text-dark outline-none transition dark:bg-dark-2 dark:text-white ${
                    errors.device_id
                      ? "border-red-500 focus:border-red-500 dark:border-red-500"
                      : "border-stroke focus:border-primary dark:border-dark-3 dark:focus:border-primary"
                  }`}
                />
                {errors.device_id && (
                  <p className="mt-1 text-xs text-red-500">{errors.device_id}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {formData.device_id.length}/50 characters
                </p>
              </div>

              <div>
                <label className="text-base font-semibold text-dark dark:text-white">
                  Model <span className="text-red-500">*</span>
                </label>
                <select
                  name="model_id"
                  value={formData.model_id}
                  onChange={handleChange}
                  className={`mt-2 w-full rounded-lg border-[1.5px] bg-transparent px-5 py-3 text-dark outline-none transition dark:bg-dark-2 dark:text-white ${
                    errors.model_id
                      ? "border-red-500 focus:border-red-500 dark:border-red-500"
                      : "border-stroke focus:border-primary dark:border-dark-3 dark:focus:border-primary"
                  }`}
                >
                  <option value="">-- Select Model --</option>
                  {models.map((model) => (
                    <option key={model.uid} value={model.uid}>
                      {model.name}
                    </option>
                  ))}
                </select>
                {errors.model_id && (
                  <p className="mt-1 text-xs text-red-500">{errors.model_id}</p>
                )}
              </div>

              <div>
                <label className="text-base font-semibold text-dark dark:text-white">
                  Status
                </label>
                <div className="mt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: true })}
                    className={`flex items-center justify-center w-16 h-10 rounded-full font-medium transition ${
                      formData.status
                        ? "bg-[#219653] text-white"
                        : "bg-gray-300 text-gray-600 dark:bg-gray-600"
                    }`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: false })}
                    className={`flex items-center justify-center w-16 h-10 rounded-full font-medium transition ${
                      !formData.status
                        ? "bg-[#DC3545] text-white"
                        : "bg-gray-300 text-gray-600 dark:bg-gray-600"
                    }`}
                  >
                    Inactive
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Updating..." : "Update Device"}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center justify-center rounded-lg bg-gray-300 px-6 py-2 text-sm font-medium text-dark hover:bg-gray-400 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
