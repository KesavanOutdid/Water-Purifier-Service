"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiCall } from "@/lib/api-client";
import { useAuth } from "@/context/auth";
import Swal from "sweetalert2";
import { EyeIcon, PencilSquareIcon, TrashIcon } from "@/assets/icons";
import { Modal } from "@/components/ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Address {
  doorno?: string | null;
  street?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
}

interface ServiceEngineer {
  _id: string;
  user_id: string;
  name: string;
  email: string;
  number: string;
  role_names: string[];
  local_distributor: string;
}

interface InstallationTask {
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
}

interface InstallationTasksApiResponse {
  success: boolean;
  data: InstallationTask[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

const taskStatusMap: { [key: string]: string } = {
  created: "Created",
  assigned: "Assigned",
  accepted: "Accepted",
  in_progress: "In Progress",
  completed: "Completed",
  rejected: "Rejected",
};

export default function ManageInstallationTasks() {
  const router = useRouter();
  const { user, permissions: allPermissions } = useAuth();
  const [tasks, setTasks] = useState<InstallationTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<InstallationTask | null>(null);
  const [engineers, setEngineers] = useState<ServiceEngineer[]>([]);
  const [selectedEngineer, setSelectedEngineer] = useState<string>("");
  const [assigningLoading, setAssigningLoading] = useState(false);
  const [isReassign, setIsReassign] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const permission = allPermissions?.find(
    (perm) => perm.module === "Manage Installation"
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    fetchTasks();
  }, [currentPage, user, searchQuery]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      
      let url: string;

      if (searchQuery.trim()) {
        url = `/api/admin/search?type=installation&query=${encodeURIComponent(searchQuery.trim())}&page=${currentPage}&limit=10`;
      } else {
        url = `/api/admin/tasks/installation?page=${currentPage}&limit=10`;
        
        if (user?.user_id) {
          url += `&user_id=${user.user_id}`;
        }
      }
      
      const response = await apiCall<InstallationTask[]>(
        url,
        {},
        true
      ) as any;
      
      if (response && response.data) {
        setTasks(Array.isArray(response.data) ? response.data : []);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages || 1);
          setTotalCount(response.pagination.totalItems || 0);
        } else if (response.total_count) {
          setTotalPages(Math.ceil(response.total_count / 10));
          setTotalCount(response.total_count);
        }
      } else {
        setTasks([]);
        setTotalPages(1);
        setTotalCount(0);
      }
    } catch (error) {
      console.error("Failed to fetch installation tasks:", error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (taskId: number, customerName: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete the installation task for "${customerName}". This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        await apiCall(`/api/admin/tasks/${taskId}`, {
          method: "DELETE",
        });

        await Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Installation task has been successfully deleted.",
          confirmButtonText: "OK",
        });

        fetchTasks();
      } catch (error) {
        console.error("Failed to delete installation task:", error);
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: error instanceof Error ? error.message : "Failed to delete installation task",
        });
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTaskStatus = (status: string) => {
    return taskStatusMap[status] || status;
  };

  const handleOpenAssignModal = async (task: InstallationTask, reassign: boolean = false) => {
    setSelectedTask(task);
    setSelectedEngineer(reassign && task.assigned_to ? task.assigned_to : "");
    setIsReassign(reassign);
    setShowAssignModal(true);
    
    try {
      const response = await apiCall<any>(
        `/api/admin/users?page=1&limit=1000&user_id=${task.local_distributor_id}`,
        {},
        true
      );
      
      if (response && response.data && Array.isArray(response.data)) {
        setEngineers(response.data);
      } else {
        setEngineers([]);
      }
    } catch (error) {
      console.error("Failed to fetch service engineers:", error);
      setEngineers([]);
    }
  };

  const handleAssignTask = async () => {
    if (!selectedTask || !selectedEngineer || !user?.email) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please select a service engineer",
      });
      return;
    }

    try {
      setAssigningLoading(true);
      
      const endpoint = isReassign
        ? `/api/admin/tasks/${selectedTask.task_id}/reassign`
        : `/api/admin/tasks/${selectedTask.task_id}/assign`;
      
      const body = isReassign
        ? {
            new_engineer_id: selectedEngineer,
            assigned_by: user.email,
          }
        : {
            engineer_id: selectedEngineer,
            assigned_by: user.email,
          };

      await apiCall(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });

      setShowAssignModal(false);

      await Swal.fire({
        icon: "success",
        title: "Success!",
        text: `Task ${isReassign ? "reassigned" : "assigned"} to engineer successfully.`,
        confirmButtonText: "OK",
        didOpen: (modal) => {
          modal.style.zIndex = "999999";
        }
      });
      setSelectedTask(null);
      setSelectedEngineer("");
      setIsReassign(false);
      fetchTasks();
    } catch (error) {
      console.error(`Failed to ${isReassign ? "reassign" : "assign"} task:`, error);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: error instanceof Error ? error.message : `Failed to ${isReassign ? "reassign" : "assign"} task`,
        didOpen: (modal) => {
          modal.style.zIndex = "999999";
        }
      });
    } finally {
      setAssigningLoading(false);
    }
  };

  return (
    <>
      <div className="rounded-[10px] bg-white px-5 pb-3 pt-5 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="mb-4 text-body-1xlg font-bold text-dark dark:text-white">
            INSTALLATION TASKS
          </h2>
          {permission?.can_create && (
            <button
              onClick={() => router.push("/management/installation/add")}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-center font-medium text-white hover:bg-opacity-90"
            >
              Add Installation Task
            </button>
          )}
        </div>

        <div className="mb-6 flex items-center justify-between gap-4">
          <div
            className="flex w-fit min-w-[200px] h-[62px]
              items-center justify-between
              rounded-[12px]
              border border-primary/20
              bg-gradient-to-br from-primary/5 to-primary/10
              px-5
              dark:border-primary/30 dark:from-primary/10 dark:to-primary/15"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
              Total Installation
            </p>

            <p className="text-lg font-bold text-primary dark:text-primary">
              {totalCount}
            </p>
          </div>

          <input
            type="text"
            placeholder="Search installation..."
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
              <TableHead className="!text-center">Task ID</TableHead>
              <TableHead className="!text-center">Customer</TableHead>
              <TableHead className="!text-center">Model</TableHead>
              <TableHead className="!text-center">Status</TableHead>
              <TableHead className="!text-center">Engineer</TableHead>
              <TableHead className="!text-center">Assign</TableHead>
              <TableHead className="!text-center">Reassign</TableHead>
              <TableHead className="!text-right xl:pr-7.5">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-dark dark:text-white">
                  Loading...
                </TableCell>
              </TableRow>
            ) : tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-dark dark:text-white">
                  No installation tasks found
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task, index) => (
                <TableRow
                  key={task._id}
                  className="border-[#eee] text-center text-base font-normal text-dark dark:border-dark-3 dark:text-white [&>td]:py-5 [&>td]:flex-1"
                >
                  <TableCell className="!text-left xl:pl-7.5">
                    <p className="text-base font-normal text-dark dark:text-white">
                      {(currentPage - 1) * 10 + index + 1}
                    </p>
                  </TableCell>
                  <TableCell className="!text-center">
                    <p className="text-base font-normal text-dark dark:text-white">
                      {task.task_id}
                    </p>
                  </TableCell>
                  <TableCell className="!text-center">
                    <p className="text-base font-normal text-dark dark:text-white">
                      {task.customer_name}
                    </p>
                  </TableCell>
                  <TableCell className="!text-center">
                    <p className="text-base font-normal text-dark dark:text-white">
                      {task.model_name}
                    </p>
                  </TableCell>
                  <TableCell className="!text-center">
                    <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
                      task.task_status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200" :
                      task.task_status === "assigned" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200" :
                      task.task_status === "accepted" ? "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-200" :
                      task.task_status === "created" ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200" :
                      task.task_status === "rejected" ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200" :
                      "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                    }`}>
                      {getTaskStatus(task.task_status)}
                    </span>
                  </TableCell>
                  <TableCell className="!text-center">
                    <p className="text-base font-normal text-dark dark:text-white">
                      {task.engineer_name || "—"}
                    </p>
                  </TableCell>
                  <TableCell className="!text-center">
                    <button
                      onClick={() => handleOpenAssignModal(task, false)}
                      disabled={!!task.assigned_to}
                      className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white transition ${
                        task.assigned_to
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-green-500 hover:bg-green-600"
                      }`}
                      title={task.assigned_to ? "Task already assigned" : "Assign task"}
                    >
                      Assign
                    </button>
                  </TableCell>
                  <TableCell className="!text-center">
                    <button
                      onClick={() => handleOpenAssignModal(task, true)}
                      disabled={!task.assigned_to}
                      className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white transition ${
                        !task.assigned_to
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-500 hover:bg-blue-600"
                      }`}
                      title={!task.assigned_to ? "Task not assigned yet" : "Reassign task"}
                    >
                      Reassign
                    </button>
                  </TableCell>
                  <TableCell className="!text-center">
                    <div className="flex items-center justify-center gap-x-3">
                      {permission?.can_view && (
                        <button
                          onClick={() => router.push(`/management/installation/${task.task_id}`)}
                          className="inline-flex items-center justify-center text-primary hover:text-opacity-80"
                          title="View task"
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

      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)}>
        <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
          {isReassign ? "Reassign Task" : "Assign Task"}
        </h3>
        {selectedTask && (
          <div className="mb-6 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Task ID</p>
                <p className="text-sm font-medium text-dark dark:text-white">{selectedTask.task_id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Customer</p>
                <p className="text-sm font-medium text-dark dark:text-white">{selectedTask.customer_name}</p>
              </div>
            </div>
          </div>
        )}
        <div className="mb-6">
          <label className="mb-2.5 block text-sm font-medium text-dark dark:text-white">
            Service Engineer
          </label>
          <select
            value={selectedEngineer}
            onChange={(e) => setSelectedEngineer(e.target.value)}
            className="w-full rounded-lg border border-[#E8E8E8] bg-transparent px-4 py-3 text-dark placeholder-gray-500 outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
          >
            <option value="">Select a service engineer</option>
            {engineers.map((engineer) => (
              <option key={engineer.user_id} value={engineer.user_id}>
                {engineer.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleAssignTask}
            disabled={assigningLoading || (isReassign && selectedEngineer === selectedTask?.assigned_to)}
            className="flex-1 rounded-lg bg-primary px-3 py-2 text-center text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {assigningLoading ? (isReassign ? "Reassigning..." : "Assigning...") : (isReassign ? "Reassign" : "Assign")}
          </button>
          <button
            onClick={() => setShowAssignModal(false)}
            disabled={assigningLoading}
            className="flex-1 rounded-lg border border-[#E8E8E8] px-3 py-2 text-center text-sm font-medium text-dark hover:shadow-1 dark:border-dark-3 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </>
  );
}
