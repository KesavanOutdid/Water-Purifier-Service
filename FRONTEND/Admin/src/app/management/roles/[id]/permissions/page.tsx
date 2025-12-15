"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiCall } from "@/lib/api-client";
import Swal from "sweetalert2";
import { useAuth } from "@/context/auth";

interface Module {
  module: string;
  actions?: string[];
  submodules?: Array<{ name: string; actions: string[] }>;
}

interface Permission {
  module: string;
  actions: string[];
  status: boolean;
}

interface ExistingPermission {
  _id: string;
  role_id: number;
  module: string;
  submodule: string | null;
  can_create: boolean;
  can_view: boolean;
  can_update: boolean;
  can_delete: boolean;
  status: boolean;
  updated_at: string;
  created_at: string;
}

interface PermissionState {
  [module: string]: {
    [action: string]: boolean;
  };
}

export default function RolePermissions() {
  const router = useRouter();
  const params = useParams();
  const roleId = params?.id as string;
  const { refreshPermissions } = useAuth();

  const [modules, setModules] = useState<Module[]>([]);
  const [permissions, setPermissions] = useState<PermissionState>({});
  const [originalPermissions, setOriginalPermissions] = useState<PermissionState>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (roleId) {
      fetchModulesAndPermissions();
    }
  }, [roleId]);

  const fetchModulesAndPermissions = async () => {
    if (!roleId) {
      setError("Invalid role ID");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const modulesData = await apiCall<Module[]>("/api/admin/permissions/modules");
      setModules(modulesData);

      const initialPermissions: PermissionState = {};
      modulesData.forEach((module) => {
        if (module.actions) {
          initialPermissions[module.module] = {};
          module.actions.forEach((action) => {
            initialPermissions[module.module][action] = false;
          });
        }
        if (module.submodules) {
          module.submodules.forEach((submodule) => {
            initialPermissions[submodule.name] = {};
            submodule.actions.forEach((action) => {
              initialPermissions[submodule.name][action] = false;
            });
          });
        }
      });

      try {
        const existingPermissions = await apiCall<ExistingPermission[]>(
          `/api/admin/permissions/roles?ids=${roleId}`
        );

        if (existingPermissions && Array.isArray(existingPermissions)) {
          existingPermissions.forEach((perm) => {
            const moduleName = perm.module;
            
            if (initialPermissions[moduleName]) {
              if (perm.can_create) {
                initialPermissions[moduleName]["create"] = true;
              }
              if (perm.can_view) {
                initialPermissions[moduleName]["view"] = true;
              }
              if (perm.can_update) {
                initialPermissions[moduleName]["update"] = true;
              }
              if (perm.can_delete) {
                initialPermissions[moduleName]["delete"] = true;
              }
            }
          });
        }
      } catch (permErr) {
        console.warn("Could not fetch existing permissions:", permErr);
      }

      setPermissions(initialPermissions);
      setOriginalPermissions(JSON.parse(JSON.stringify(initialPermissions)));
    } catch (err) {
      console.error("Failed to fetch modules:", err);
      setError("Failed to load permissions modules.");
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = () => {
    return JSON.stringify(permissions) !== JSON.stringify(originalPermissions);
  };

  const handleActionChange = (module: string, action: string) => {
    setPermissions((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: !prev[module][action],
      },
    }));
  };

  const handleSelectAllModule = (module: string) => {
    if (!permissions[module]) {
      return;
    }
    const allSelected = Object.values(permissions[module]).every((val) => val);
    setPermissions((prev) => ({
      ...prev,
      [module]: Object.keys(prev[module]).reduce(
        (acc, action) => {
          acc[action] = !allSelected;
          return acc;
        },
        {} as { [key: string]: boolean }
      ),
    }));
  };

  const handleSavePermissions = async () => {
    try {
      setSaving(true);
      setError(null);

      const permissionsData: Permission[] = [];

      modules.forEach((module) => {
        if (module.actions) {
          permissionsData.push({
            module: module.module,
            actions: module.actions.filter((action) => permissions[module.module][action]),
            status: Object.values(permissions[module.module]).some((val) => val),
          });
        }
        if (module.submodules) {
          module.submodules.forEach((submodule) => {
            permissionsData.push({
              module: submodule.name,
              actions: submodule.actions.filter((action) => permissions[submodule.name][action]),
              status: Object.values(permissions[submodule.name]).some((val) => val),
            });
          });
        }
      });

      const payload = {
        role_id: parseInt(roleId),
        permissions: permissionsData,
      };

      await apiCall("/api/admin/permissions/bulk", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      await refreshPermissions();
      Swal.fire("Success", "Permissions updated successfully", "success");
      setOriginalPermissions(JSON.parse(JSON.stringify(permissions)));
    } catch (err) {
      console.error("Failed to save permissions:", err);
      Swal.fire("Error", "Failed to save permissions. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-dark dark:text-white">Loading permissions...</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-body-1xlg font-bold text-dark dark:text-white">
          ROLE PERMISSIONS
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

      {error && (
        <div className="mb-6 rounded-lg bg-red-100 px-5 py-3 text-red-700 dark:bg-red-900 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        <div className="rounded-[10px] bg-white px-7.5 pb-7.5 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card">
          <h2 className="mb-6 text-body-lg font-bold text-dark dark:text-white">
            Assign Permissions
          </h2>

          <div className="space-y-6">
            {modules.map((module) => {
              if (module.actions) {
                const modulePermissions = permissions[module.module] || {};
                const allActionsSelected = module.actions.length > 0
                  ? module.actions.every((action) => modulePermissions[action])
                  : false;

                return (
                  <div
                    key={module.module}
                    className="border-b border-gray-200 pb-6 last:border-b-0 dark:border-gray-700"
                  >
                    <div className="mb-4 flex items-center gap-4">
                      <input
                        type="checkbox"
                        id={`module-${module.module}`}
                        checked={allActionsSelected}
                        onChange={() => handleSelectAllModule(module.module)}
                        className="h-4 w-4 cursor-pointer rounded border-gray-300"
                      />
                      <label
                        htmlFor={`module-${module.module}`}
                        className="cursor-pointer text-base font-semibold text-dark dark:text-white"
                      >
                        {module.module}
                      </label>
                    </div>

                    <div className="ml-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                      {module.actions.map((action) => (
                        <div key={`${module.module}-${action}`} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`${module.module}-${action}`}
                            checked={modulePermissions[action] || false}
                            onChange={() => handleActionChange(module.module, action)}
                            className="h-4 w-4 cursor-pointer rounded border-gray-300"
                          />
                          <label
                            htmlFor={`${module.module}-${action}`}
                            className="cursor-pointer text-sm capitalize text-dark dark:text-white"
                          >
                            {action}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              if (module.submodules) {
                return (
                  <div key={module.module}>
                    <h3 className="mb-4 text-base font-semibold text-dark dark:text-white">
                      {module.module}
                    </h3>
                    <div className="space-y-4 pl-4">
                      {module.submodules.map((submodule) => {
                        const submodulePermissions = permissions[submodule.name] || {};
                        const allActionsSelected = submodule.actions.length > 0
                          ? submodule.actions.every((action) => submodulePermissions[action])
                          : false;

                        return (
                          <div
                            key={submodule.name}
                            className="border-b border-gray-200 pb-4 last:border-b-0 dark:border-gray-700"
                          >
                            <div className="mb-3 flex items-center gap-4">
                              <input
                                type="checkbox"
                                id={`module-${submodule.name}`}
                                checked={allActionsSelected}
                                onChange={() => handleSelectAllModule(submodule.name)}
                                className="h-4 w-4 cursor-pointer rounded border-gray-300"
                              />
                              <label
                                htmlFor={`module-${submodule.name}`}
                                className="cursor-pointer text-sm font-semibold text-dark dark:text-white"
                              >
                                {submodule.name}
                              </label>
                            </div>

                            <div className="ml-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                              {submodule.actions.map((action) => (
                                <div key={`${submodule.name}-${action}`} className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id={`${submodule.name}-${action}`}
                                    checked={submodulePermissions[action] || false}
                                    onChange={() => handleActionChange(submodule.name, action)}
                                    className="h-4 w-4 cursor-pointer rounded border-gray-300"
                                  />
                                  <label
                                    htmlFor={`${submodule.name}-${action}`}
                                    className="cursor-pointer text-sm capitalize text-dark dark:text-white"
                                  >
                                    {action}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={handleSavePermissions}
              disabled={saving || !hasChanges()}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Permissions"}
            </button>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center justify-center rounded-lg bg-gray-300 px-6 py-2 text-sm font-medium text-dark hover:bg-gray-400 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
