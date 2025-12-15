"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiCall } from "@/lib/api-client";

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

export default function ViewRole() {
  const router = useRouter();
  const params = useParams();
  const roleId = params?.id as string;

  const [role, setRole] = useState<RoleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err) {
      console.error("Failed to fetch role details:", err);
      setError("Failed to load role details. Invalid role ID.");
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
          ROLE DETAILS
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
            Role Information
          </h2>

          <div className="grid grid-cols-4 gap-6">
            <div>
              <label className="text-base font-semibold text-dark dark:text-white">
                Role Name
              </label>
              <p className="mt-2 text-dark dark:text-white">{role.role_name}</p>
            </div>

            <div>
              <label className="text-base font-semibold text-dark dark:text-white">
                Status
              </label>
              <div className="mt-2">
                <span
                  className={`inline-flex rounded-full px-3.5 py-1 text-sm font-normal ${
                    role.status
                      ? "bg-[#219653]/[0.08] text-[#219653]"
                      : "bg-[#DC3545]/[0.08] text-[#DC3545]"
                  }`}
                >
                  {role.status ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            <div>
              <label className="text-base font-semibold text-dark dark:text-white">
                Created By
              </label>
              <p className="mt-2 text-dark dark:text-white">
                {role.created_by || "N/A"}
              </p>
            </div>

            <div>
              <label className="text-base font-semibold text-dark dark:text-white">
                Created At
              </label>
              <p className="mt-2 text-dark dark:text-white">
                {new Date(role.created_time).toLocaleString()}
              </p>
            </div>

            <div>
              <label className="text-base font-semibold text-dark dark:text-white">
                Modified By
              </label>
              <p className="mt-2 text-dark dark:text-white">
                {role.modified_by || "N/A"}
              </p>
            </div>

            <div>
              <label className="text-base font-semibold text-dark dark:text-white">
                Modified At
              </label>
              <p className="mt-2 text-dark dark:text-white">
                {role.modified_at ? new Date(role.modified_at).toLocaleString() : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
