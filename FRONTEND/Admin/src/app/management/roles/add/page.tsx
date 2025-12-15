"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiCall } from "@/lib/api-client";
import { useAuth } from "@/context/auth";
import Swal from "sweetalert2";

export default function AddRole() {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState({ name: "", created_by: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.email) {
      setFormData((prev) => ({
        ...prev,
        created_by: user.email,
      }));
    }
  }, [user?.email]);

  const MAX_ROLE_NAME = 50;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    if (value.length <= MAX_ROLE_NAME) {
      setFormData((prev) => ({ ...prev, name: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      Swal.fire("Error", "Please enter a role name", "error");
      return;
    }

    if (!formData.created_by) {
      Swal.fire("Error", "User information is not loaded", "error");
      return;
    }

    try {
      setSubmitting(true);
      await apiCall("/api/admin/roles", {
        method: "POST",
        body: JSON.stringify({ 
          role_name: formData.name,
          created_by: formData.created_by,
        }),
      });

      Swal.fire("Success", "Role created successfully", "success");
      router.push("/management/roles");
    } catch (error) {
      console.error("Failed to create role:", error);
      Swal.fire("Error", "Failed to create role", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-body-1xlg font-bold text-dark dark:text-white">
          ADD NEW ROLE
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
            Role Information
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-5.5">
              <label className="text-base font-semibold text-dark dark:text-white">
                Role Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter role name"
                maxLength={MAX_ROLE_NAME}
                required
                className="mt-2 w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
              />
              <div className="mt-1.5 flex justify-between items-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formData.name.length}/{MAX_ROLE_NAME} characters
                </span>
                {formData.name.trim() && (
                  <span className="text-xs text-primary font-medium">
                    ✓ Valid
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                className="rounded-lg border border-stroke px-6 py-[7px] font-medium text-dark hover:shadow-1 dark:border-dark-3 dark:text-white"
                type="button"
                onClick={() => router.back()}
              >
                Cancel
              </button>

              <button
                className="rounded-lg bg-primary px-6 py-[7px] font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Creating..." : "Create Role"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
