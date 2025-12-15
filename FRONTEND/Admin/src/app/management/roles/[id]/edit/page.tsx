"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiCall } from "@/lib/api-client";
import { useAuth } from "@/context/auth";
import Swal from "sweetalert2";

interface RoleDetail {
  _id: string;
  role_id: number;
  role_name: string;
  status: boolean;
  created_by: string;
  created_time: string;
  modified_by: string | null;
  modified_at: string | null;
}

export default function EditRole() {
  const router = useRouter();
  const params = useParams();
  const roleId = params?.id as string;
  const { user } = useAuth();

  const [role, setRole] = useState<RoleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ role_name: "", status: true });
  const [initialFormData, setInitialFormData] = useState({ role_name: "", status: true });
  const [submitting, setSubmitting] = useState(false);

  const MAX_ROLE_NAME = 50;

  useEffect(() => {
    if (roleId) {
      fetchRoleDetail();
    }
  }, [roleId]);

  const fetchRoleDetail = async () => {
    if (!roleId) {
      setError("Invalid role ID");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await apiCall<RoleDetail>(`/api/admin/roles/${roleId}`);
      setRole(data);
      const roleData = {
        role_name: data.role_name,
        status: data.status,
      };
      setFormData(roleData);
      setInitialFormData(roleData);
    } catch (err) {
      console.error("Failed to fetch role details:", err);
      setError("Failed to load role details. Invalid role ID.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    if (name === "role_name" && value.length > MAX_ROLE_NAME) {
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const hasChanges = (): boolean => {
    return JSON.stringify(formData) !== JSON.stringify(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.role_name.trim()) {
      Swal.fire("Error", "Please enter a role name", "error");
      return;
    }

    try {
      setSubmitting(true);
      if (!role) {
        Swal.fire("Error", "Role data not loaded", "error");
        return;
      }
      
      await apiCall(`/api/admin/roles/${roleId}`, {
        method: "PUT",
        body: JSON.stringify({
          role_name: formData.role_name,
          status: formData.status,
          modified_by: user?.email || "",
        }),
      });

      Swal.fire("Success", "Role updated successfully", "success");
      router.push(`/management/roles`);
    } catch (error) {
      console.error("Failed to update role:", error);
      Swal.fire("Error", "Failed to update role", "error");
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

  if (error || !role) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-red-500 mb-4">{error || "Role not found"}</p>
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
          EDIT ROLE
        </h1>
        <button
          onClick={() => router.push("/management/roles")}
          className="inline-flex items-center justify-center rounded-lg bg-gray-300 px-5 py-2 text-sm font-medium text-dark hover:bg-gray-400 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-700"
        >
          Back
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="rounded-[10px] bg-white px-7.5 pb-7.5 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card">
          <h2 className="mb-6 text-body-lg font-bold text-dark dark:text-white">
            Edit Role Information
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-6 mb-5.5">
              <div>
                <label className="text-base font-semibold text-dark dark:text-white">
                  Role Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="role_name"
                  value={formData.role_name}
                  onChange={handleChange}
                  placeholder="Enter role name"
                  maxLength={MAX_ROLE_NAME}
                  required
                  disabled
                  className="mt-2 w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                />
                <div className="mt-1.5 flex justify-between items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formData.role_name.length}/{MAX_ROLE_NAME} characters
                  </span>
                 
                </div>
              </div>

              <div>
                <label className="text-base font-semibold text-dark dark:text-white">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status ? "true" : "false"}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: e.target.value === "true",
                    }))
                  }
                  className="mt-2 w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-dark outline-none transition focus:border-primary active:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                >
                  <option value="true">Active</option>
                  <option value="false">InActive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                className="rounded-lg border border-stroke px-6 py-[7px] font-medium text-dark hover:shadow-1 dark:border-dark-3 dark:text-white"
                type="button"
                onClick={() => router.push("/management/roles")}
              >
                Cancel
              </button>

              <button
                className="rounded-lg bg-primary px-6 py-[7px] font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
                type="submit"
                disabled={submitting || !hasChanges()}
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
