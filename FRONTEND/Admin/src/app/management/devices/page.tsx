"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiCall } from "@/lib/api-client";
import { useAuth } from "@/context/auth";
import Swal from "sweetalert2";
import { EyeIcon, PencilSquareIcon, TrashIcon } from "@/assets/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";

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
  assigned_to?: string;
  assigned_to_local?: string | null;
  distributor_id?: string;
  local_distributor_id?: string;
}

interface DevicesApiResponse {
  success: boolean;
  data: Device[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

interface Distributor {
  _id: string;
  user_id: string;
  name: string;
  email: string;
}

export default function ManageDevices() {
  const router = useRouter();
  const { user, permissions: allPermissions } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [togglingDeviceId, setTogglingDeviceId] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loadingDistributors, setLoadingDistributors] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [assigningDeviceId, setAssigningDeviceId] = useState<string | null>(null);
  const [isReassign, setIsReassign] = useState(false);
  const [selectedDistributorId, setSelectedDistributorId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const permission = allPermissions?.find(
    (perm) => perm.module === "Manage Devices"
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    fetchDevices();
  }, [currentPage, user, searchQuery]);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      
      let url: string;
      
      if (searchQuery.trim()) {
        url = `/api/admin/search?type=device&query=${encodeURIComponent(searchQuery.trim())}&page=${currentPage}&limit=10`;
      } else {
        url = `/api/admin/devices?page=${currentPage}&limit=10`;
        
        if (user?.user_id) {
          url += `&assignee_id=${user.user_id}`;
          
          if (user.role_names?.includes("Distributor")) {
            url += `&level=distributor`;
          } else if (user.role_names?.includes("Local Distributor")) {
            url += `&level=local_distributor`;
          }
        }
      }
      
      const response = await apiCall<Device[]>(
        url,
        {},
        true
      ) as any;
      
      if (response && response.data) {
        setDevices(Array.isArray(response.data) ? response.data : []);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages || 1);
          setTotalCount(response.pagination.totalItems || 0);
        } else if (response.total_count) {
          setTotalPages(Math.ceil(response.total_count / 10));
          setTotalCount(response.total_count);
        }
      } else {
        setDevices([]);
        setTotalPages(1);
        setTotalCount(0);
      }
    } catch (error) {
      console.error("Failed to fetch devices:", error);
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };



  const handleDelete = async (deviceId: string, deviceName: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete "${deviceName}". This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        await apiCall(`/api/admin/devices/${deviceId}`, {
          method: "DELETE",
        });

        await Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Device has been successfully deleted.",
          confirmButtonText: "OK",
          didOpen: (modal) => {
            modal.style.zIndex = "999999";
          }
        });

        fetchDevices();
      } catch (error) {
        console.error("Failed to delete device:", error);
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: error instanceof Error ? error.message : "Failed to delete device",
          didOpen: (modal) => {
            modal.style.zIndex = "999999";
          }
        });
      }
    }
  };

  const handleToggleStatus = async (device: Device) => {
    try {
      setTogglingDeviceId(device.device_id);
      await apiCall(`/api/admin/devices/${device.device_id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: !device.status,
          modified_by: user?.email || "",
        }),
      });

      setDevices(devices.map(d => 
        d.device_id === device.device_id ? { ...d, status: !d.status } : d
      ));

      Swal.fire({
        icon: "success",
        title: "Updated!",
        text: `Device status changed to ${!device.status ? "Active" : "Inactive"}`,
        timer: 2000,
        showConfirmButton: false,
        didOpen: (modal) => {
          modal.style.zIndex = "999999";
        }
      });
    } catch (error) {
      console.error("Failed to update device status:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error instanceof Error ? error.message : "Failed to update device status",
        didOpen: (modal) => {
          modal.style.zIndex = "999999";
        }
      });
    } finally {
      setTogglingDeviceId(null);
    }
  };

  const fetchDistributors = async () => {
    try {
      setLoadingDistributors(true);
      
      let url = `/api/admin/users?page=1&limit=100`;
      
      if (user?.role_names?.includes("Distributor") && user?.user_id) {
        url += `&user_id=${user.user_id}`;
      }
      
      const response = await apiCall<any>(
        url,
        {},
        true
      ) as any;

      if (response && response.data) {
        let filteredUsers = response.data;
        
        if (user?.role_names?.includes("Distributor")) {
          filteredUsers = response.data.filter((userItem: any) =>
            userItem.role_names && userItem.role_names.includes("Local Distributor")
          );
        } else {
          filteredUsers = response.data.filter((userItem: any) =>
            userItem.role_names && userItem.role_names.includes("Distributor")
          );
        }
        
        setDistributors(filteredUsers);
      }
    } catch (error) {
      console.error("Failed to fetch distributors:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load distributors",
        didOpen: (modal) => {
          modal.style.zIndex = "999999";
        }
      });
    } finally {
      setLoadingDistributors(false);
    }
  };

  const handleOpenAssignModal = async (device: Device, reassign: boolean = false) => {
    setSelectedDevice(device);
    setIsReassign(reassign);
    setSelectedDistributorId(null);
    setShowAssignModal(true);
    await fetchDistributors();
  };

  const handleAssignDevice = async () => {
    if (!selectedDevice || !selectedDistributorId) return;

    try {
      setAssigningDeviceId(selectedDevice.device_id);
      
      const endpoint = isReassign
        ? `/api/admin/devices/${selectedDevice.device_id}/reassign`
        : `/api/admin/devices/${selectedDevice.device_id}/assign`;

      const isDistributorRole = user?.role_names?.includes("Distributor");
      const level = isDistributorRole ? "local_distributor" : "distributor";
      const assignKey = isDistributorRole ? "local_distributor_id" : "distributor_id";
      const reassignKey = isDistributorRole ? "new_local_distributor_id" : "new_distributor_id";

      const body = isReassign
        ? {
            level,
            [reassignKey]: selectedDistributorId,
            assigned_by: user?.email || "",
          }
        : {
            level,
            [assignKey]: selectedDistributorId,
            assigned_by: user?.email || "",
          };

      await apiCall(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });

      Swal.fire({
        icon: "success",
        title: isReassign ? "Reassigned!" : "Assigned!",
        text: `Device has been successfully ${isReassign ? "reassigned" : "assigned"}.`,
        timer: 2000,
        showConfirmButton: false,
        didOpen: (modal) => {
          modal.style.zIndex = "999999";
        }
      });

      setShowAssignModal(false);
      setSelectedDevice(null);
      setIsReassign(false);
      setSelectedDistributorId(null);
      fetchDevices();
    } catch (error) {
      console.error("Failed to assign device:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error instanceof Error ? error.message : "Failed to assign device",
        didOpen: (modal) => {
          modal.style.zIndex = "999999";
        }
      });
    } finally {
      setAssigningDeviceId(null);
    }
  };

  return (
    <>
      <div className="rounded-[10px] bg-white px-7.5 pb-4 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="mb-4 text-body-1xlg font-bold text-dark dark:text-white">
            DEVICES LIST
          </h2>
          {permission?.can_create && (
            <button
              onClick={() => router.push("/management/devices/add")}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-center font-medium text-white hover:bg-opacity-90"
            >
              Add New Device
            </button>
          )}
        </div>

        <div className="mb-6 flex items-center justify-between gap-4">
          <div
            className="flex w-fit min-w-[180px] h-[62px]
              items-center justify-between
              rounded-[12px]
              border border-primary/20
              bg-gradient-to-br from-primary/5 to-primary/10
              px-5
              dark:border-primary/30 dark:from-primary/10 dark:to-primary/15"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
              Total Devices
            </p>

            <p className="text-lg font-bold text-primary dark:text-primary">
              {totalCount}
            </p>
          </div>

          <input
            type="text"
            placeholder="Search devices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 flex-1 max-w-[300px] rounded-[6px] border border-gray-300 bg-white px-4 py-2 text-base font-normal text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-dark dark:text-white dark:placeholder-gray-400"
          />
        </div>


        <Table>
          <TableHeader>
            <TableRow className="border-none bg-[#F7F9FC] dark:bg-dark-2 uppercase [&>th]:py-4 [&>th]:text-sm [&>th]:text-dark [&>th]:dark:text-white [&>th]:text-center [&>th]:flex-1">
              <TableHead className="!text-left">
                SI.NO
              </TableHead>
              <TableHead className="!text-center">Device ID</TableHead>
              <TableHead className="!text-center">Name</TableHead>
              <TableHead className="!text-center">Created By</TableHead>
              <TableHead className="!text-center">Status</TableHead>
              {!user?.role_names?.includes("Local Distributor") && (
                <>
                  <TableHead className="!text-center">Assign</TableHead>
                  <TableHead className="!text-center">Reassign</TableHead>
                </>
              )}
              <TableHead className="!text-right xl:pr-7.5">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-dark dark:text-white">
                  Loading...
                </TableCell>
              </TableRow>
            ) : devices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-dark dark:text-white">
                  No devices found
                </TableCell>
              </TableRow>
            ) : (
              devices.map((device, index) => (
                <TableRow
                  key={device._id}
                  className="border-[#eee] text-center text-base font-normal text-dark dark:border-dark-3 dark:text-white [&>td]:py-5 [&>td]:flex-1"
                >
                  <TableCell className="!text-left xl:pl-7.5">
                    <p className="text-base font-normal text-dark dark:text-white">
                      {(currentPage - 1) * 10 + index + 1}
                    </p>
                  </TableCell>
                  <TableCell className="!text-center">
                    <p className="text-base font-normal text-dark dark:text-white">
                      {device.device_id}
                    </p>
                  </TableCell>
                  <TableCell className="!text-center">
                    <p className="text-base font-normal text-dark dark:text-white">
                      {device.name}
                    </p>
                  </TableCell>
                  <TableCell className="!text-center">
                    <p className="text-base font-normal text-dark dark:text-white">
                      {device.created_by}
                    </p>
                  </TableCell>
                  <TableCell className="!text-center">
                    {permission?.can_update ? (
                      <button
                        onClick={() => handleToggleStatus(device)}
                        disabled={togglingDeviceId === device.device_id}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          device.status
                            ? "bg-[#219653]"
                            : "bg-[#DC3545]"
                        } disabled:opacity-50`}
                        title={`Click to ${device.status ? "deactivate" : "activate"}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                            device.status ? "translate-x-4" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    ) : (
                      <button
                        disabled
                        className="relative inline-flex h-5 w-9 items-center rounded-full bg-gray-300"
                        title="No permission to update status"
                      >
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform translate-x-0.5" />
                      </button>
                    )}
                  </TableCell>
                  {!user?.role_names?.includes("Local Distributor") && (
                    <TableCell className="!text-center">
                      <button
                        onClick={() => handleOpenAssignModal(device, false)}
                        disabled={user?.role_names?.includes("Distributor") ? !!device.assigned_to_local : !!device.assigned_to}
                        className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white transition ${
                          (user?.role_names?.includes("Distributor") ? !!device.assigned_to_local : !!device.assigned_to)
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-green-500 hover:bg-green-600"
                        }`}
                        title={user?.role_names?.includes("Distributor") ? (device.assigned_to_local ? "Device already assigned to local distributor" : "Assign to local distributor") : (device.assigned_to ? "Device already assigned" : "Assign device")}
                      >
                        Assign
                      </button>
                    </TableCell>
                  )}
                  {!user?.role_names?.includes("Local Distributor") && (
                    <TableCell className="!text-center">
                      <button
                        onClick={() => handleOpenAssignModal(device, true)}
                        disabled={user?.role_names?.includes("Distributor") ? !device.assigned_to_local : !device.assigned_to}
                        className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white transition ${
                          (user?.role_names?.includes("Distributor") ? !device.assigned_to_local : !device.assigned_to)
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-500 hover:bg-blue-600"
                        }`}
                        title={user?.role_names?.includes("Distributor") ? (!device.assigned_to_local ? "Device not assigned to local distributor yet" : "Reassign from local distributor") : (!device.assigned_to ? "Device not assigned yet" : "Reassign device")}
                      >
                        Reassign
                      </button>
                    </TableCell>
                  )}
                  <TableCell className="!text-right xl:pr-7.5">
                    <div className="flex items-center justify-center gap-x-3">
                      {permission?.can_view && (
                        <button
                          onClick={() => router.push(`/management/devices/${device.device_id}`)}
                          className="inline-flex items-center justify-center text-primary hover:text-opacity-80"
                          title="View device"
                        >
                          <EyeIcon />
                        </button>
                      )}
                   
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center justify-center rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 disabled:border-gray-300 disabled:text-gray-300 disabled:cursor-not-allowed dark:border-primary dark:text-primary"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition ${
                  currentPage === page
                    ? "bg-primary text-white"
                    : "border border-[#E8E8E8] text-dark hover:border-primary dark:border-dark-3 dark:text-white dark:hover:border-primary"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center justify-center rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 disabled:border-gray-300 disabled:text-gray-300 disabled:cursor-not-allowed dark:border-primary dark:text-primary"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedDevice(null);
          setIsReassign(false);
          setSelectedDistributorId(null);
        }}
      >
        <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
          {isReassign ? "Reassign Device" : "Assign Device"}
        </h3>
        <div className="mb-6 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-md text-gray-500 dark:text-gray-400">Device ID</p>
              <p className="text-xs font-medium text-dark dark:text-white">{selectedDevice?.device_id}</p>
            </div>
            <div>
              <p className="text-md text-gray-500 dark:text-gray-400">Device Name</p>
              <p className="text-xs font-medium text-dark dark:text-white">{selectedDevice?.name}</p>
            </div>
          </div>
          {isReassign && selectedDevice?.distributor_name && (
            <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
              <p className="text-md text-gray-500 dark:text-gray-400">Current Distributor</p>
              <p className="text-sm font-medium text-dark dark:text-white">{selectedDevice.distributor_name}</p>
            </div>
          )}
        </div>

        {loadingDistributors ? (
          <div className="py-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Loading...
          </div>
        ) : distributors.length === 0 ? (
          <div className="py-6 text-center text-sm text-gray-600 dark:text-gray-400">
            No distributors available
          </div>
        ) : (() => {
          const isDistributorRole = user?.role_names?.includes("Distributor");
          const currentAssignedId = isDistributorRole ? selectedDevice?.assigned_to_local : selectedDevice?.assigned_to;
          
          const displayDistributors = isReassign ? distributors : distributors.filter((distributor) => 
            distributor.user_id !== currentAssignedId
          );

          if (displayDistributors.length === 0) {
            return (
              <div className="mb-6 text-center text-sm text-gray-600 dark:text-gray-400">
                No distributors available
              </div>
            );
          }

          const labelText = isDistributorRole ? "Select Local Distributor" : "Select Distributor";
          const placeholderText = isDistributorRole ? "-- Select a local distributor --" : "-- Select a distributor --";
          
          return (
            <div className="mb-6">
              <label className="block text-sm font-medium text-dark dark:text-white mb-2">
                {labelText}
              </label>
              <select
                value={selectedDistributorId || ""}
                onChange={(e) => setSelectedDistributorId(e.target.value || null)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-dark placeholder-gray-500 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary"
              >
                <option value="">{placeholderText}</option>
                {displayDistributors.map((distributor) => (
                  <option 
                    key={distributor._id} 
                    value={distributor.user_id}
                    disabled={isReassign && distributor.user_id === currentAssignedId}
                  >
                    {distributor.name} ({distributor.email})
                    {isReassign && distributor.user_id === currentAssignedId ? " (Current)" : ""}
                  </option>
                ))}
              </select>
            </div>
          );
        })()}

        <div className="flex justify-end gap-3">
          <button
            onClick={() => {
              setShowAssignModal(false);
              setSelectedDevice(null);
              setIsReassign(false);
              setSelectedDistributorId(null);
            }}
            className="rounded-lg bg-gray-200 px-6 py-2 text-xs font-medium text-dark hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleAssignDevice}
            disabled={
              !selectedDistributorId || 
              assigningDeviceId === selectedDevice?.device_id ||
              (isReassign && (selectedDistributorId === selectedDevice?.assigned_to || selectedDistributorId === selectedDevice?.assigned_to_local))
            }
            className="rounded-lg bg-primary px-6 py-2 text-xs font-medium text-white hover:bg-opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isReassign ? "Reassign" : "Assign"}
          </button>
        </div>
      </Modal>
    </>
  );
}
