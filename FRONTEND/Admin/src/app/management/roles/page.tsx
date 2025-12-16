"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiCall } from "@/lib/api-client";
import { useAuth } from "@/context/auth";
import Swal from "sweetalert2";
import { EyeIcon, PencilSquareIcon, LockIcon } from "@/assets/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Role {
  _id: string;
  role_id: number;
  role_name: string;
  status: boolean;
  created_by: string;
  created_time: string;
  modified_by: string | null;
  modified_at: string | null;
}

interface RolesApiResponse {
  success: boolean;
  data: Role[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export default function ManageRoles() {
  const router = useRouter();
  const { permissions: allPermissions } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const permission = allPermissions?.find(
    (perm) => perm.module === "Manage Roles"
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    fetchRoles();
  }, [currentPage, searchQuery]);

  const fetchRoles = async () => {
    try {
      setLoading(true);

      let url: string;

      if (searchQuery.trim()) {
        url = `/api/admin/search?type=role&query=${encodeURIComponent(searchQuery.trim())}&page=${currentPage}&limit=10`;
      } else {
        url = `/api/admin/roles?page=${currentPage}&limit=10`;
      }

      const response = await apiCall<Role[]>(
        url,
        {},
        true
      ) as any;
      
      if (response && response.data) {
        setRoles(Array.isArray(response.data) ? response.data : []);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages || 1);
          setTotalCount(response.pagination.totalItems || 0);
        } else if (response.total_count) {
          setTotalPages(Math.ceil(response.total_count / 10));
          setTotalCount(response.total_count);
        }
      } else {
        setRoles([]);
        setTotalPages(1);
        setTotalCount(0);
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error);
      Swal.fire("Error", "Failed to load roles", "error");
      setRoles([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };



  const handleViewRole = (id: string) => {
    router.push(`/management/roles/${id}`);
  };

  const handleEditRole = (id: string) => {
    router.push(`/management/roles/${id}/edit`);
  };

  const handlePermissions = (id: string) => {
    router.push(`/management/roles/${id}/permissions`);
  };



  return (
    <>
     

      <div className="rounded-[10px] bg-white px-7.5 pb-4 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-body-1xlg font-semibold text-dark dark:text-white">
            ROLES LIST
          </h2>
          {permission?.can_create && (
            <button
              onClick={() => router.push("/management/roles/add")}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-center font-medium text-white hover:bg-opacity-90"
            >
              Add New Role
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
              Total Roles
            </p>

            <p className="text-lg font-bold text-primary dark:text-primary">
              {totalCount}
            </p>
          </div>

          <input
            type="text"
            placeholder="Search roles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 flex-1 max-w-[300px] rounded-[6px] border border-gray-300 bg-white px-4 py-2 text-base font-normal text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-dark dark:text-white dark:placeholder-gray-400"
          />
        </div>


        <Table>
          <TableHeader>
            <TableRow className="border-none bg-[#F7F9FC] dark:bg-dark-2 uppercase [&>th]:py-4 [&>th]:text-sm [&>th]:text-dark [&>th]:dark:text-white [&>th]:text-center">
              <TableHead className="min-w-[80px] !text-left xl:pl-7.5">
                SI.NO
              </TableHead>
              <TableHead className="min-w-[200px]">
                Role Name
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead className="text-center">Permissions</TableHead>
              <TableHead className="!text-right xl:pr-7.5">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-dark dark:text-white">
                  Loading...
                </TableCell>
              </TableRow>
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-dark dark:text-white">
                  No roles found
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role, index) => (
                <TableRow
                  key={role._id}
                  className="border-[#eee] text-center text-base font-normal text-dark dark:border-dark-3 dark:text-white"
                >
                  <TableCell className="min-w-[80px] !text-left xl:pl-7.5">
                    <p className="py-4 text-base font-normal text-dark dark:text-white">
                      {(currentPage - 1) * 10 + index + 1}
                    </p>
                  </TableCell>
                  <TableCell className="min-w-[200px] text-center">
                    <p className="text-base font-normal text-dark dark:text-white">
                      {role.role_name}
                    </p>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-3.5 py-1 text-base font-normal ${
                        role.status
                          ? "bg-[#219653]/[0.08] text-[#219653]"
                          : "bg-[#DC3545]/[0.08] text-[#DC3545]"
                      }`}
                    >
                      {role.status ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <p className="text-base font-normal text-dark dark:text-white">
                      {new Date(role.created_time).toLocaleDateString()}
                    </p>
                  </TableCell>
                  <TableCell className="text-center">
                    {permission?.can_update && (
                      <button
                        onClick={() => handlePermissions(String(role.role_id))}
                        className="hover:text-primary"
                        title="Manage Permissions"
                      >
                        <PencilSquareIcon className="w-5 h-5" />
                      </button>
                    )}
                  </TableCell>
                  <TableCell className="!text-right xl:pr-7.5">
                    <div className="flex items-center justify-end gap-x-3.5">
                      {permission?.can_view && (
                        <button
                          onClick={() => handleViewRole(String(role.role_id))}
                          className="text-primary hover:text-opacity-80"
                          title="View"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                      )}
                      {permission?.can_update && (
                        <button
                          onClick={() => handleEditRole(String(role.role_id))}
                          className="text-primary hover:text-opacity-80"
                          title="Edit"
                        >
                          <PencilSquareIcon className="w-5 h-5" />
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


    </>
  );
}
