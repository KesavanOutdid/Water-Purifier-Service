"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiCall } from "@/lib/api-client";
import { useAuth } from "@/context/auth";
import Swal from "sweetalert2";
import { EyeIcon, PencilSquareIcon, TrashIcon, UserIcon } from "@/assets/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface User {
  _id: string;
  user_id: string;
  name: string;
  email: string;
  number: string;
  roles: number[];
  role_names: string[];
  status: boolean;
  created_at: string;
}

interface UsersApiResponse {
  success: boolean;
  data: User[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export default function ManageUsers() {
  const router = useRouter();
  const { user, permissions: allPermissions } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const permission = allPermissions?.find(
    (perm) => perm.module === "Manage Users"
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchQuery]);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      let url: string;

      if (searchQuery.trim()) {
        url = `/api/admin/search?type=user&query=${encodeURIComponent(searchQuery.trim())}&page=${currentPage}&limit=10`;
      } else {
        url = `/api/admin/users?page=${currentPage}&limit=10`;
        if (user?.user_id) {
          url += `&user_id=${user.user_id}`;
        }
      }
      
      const response = await apiCall<User[]>(
        url,
        {},
        true
      ) as any;
      
      if (response && response.data) {
        setUsers(Array.isArray(response.data) ? response.data : []);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages || 1);
          setTotalCount(response.pagination.totalItems || 0);
        } else if (response.total_count) {
          setTotalPages(Math.ceil(response.total_count / 10));
          setTotalCount(response.total_count);
        }
      } else {
        setUsers([]);
        setTotalPages(1);
        setTotalCount(0);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const getRoleName = (roleNames: string[]) => {
    return roleNames && roleNames.length > 0 ? roleNames.join(", ") : "Unknown";
  };

  const handleDelete = async (userId: string, userName: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete "${userName}". This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        await apiCall(`/api/admin/users/${userId}`, {
          method: "DELETE",
        });

        await Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "User has been successfully deleted.",
          confirmButtonText: "OK",
        });

        fetchUsers();
      } catch (error) {
        console.error("Failed to delete user:", error);
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: error instanceof Error ? error.message : "Failed to delete user",
        });
      }
    }
  };

  return (
    <>
     

      <div className="rounded-[10px] bg-white px-7.5 pb-4 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="mb-4 text-body-1xlg font-bold text-dark dark:text-white">
            USERS LIST
          </h2>
          {permission?.can_create && (
            <button
              onClick={() => router.push("/management/users/add")}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-center font-medium text-white hover:bg-opacity-90"
            >
              Add New User
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
              Total Users
            </p>

            <p className="text-lg font-bold text-primary dark:text-primary">
              {totalCount}
            </p>
          </div>

          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 flex-1 max-w-[300px] rounded-[6px] border border-gray-300 bg-white px-4 py-2 text-base font-normal text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-dark dark:text-white dark:placeholder-gray-400"
          />
        </div>




        <Table>
          <TableHeader>
            <TableRow className="border-none bg-[#F7F9FC] dark:bg-dark-2 uppercase [&>th]:py-4 [&>th]:text-sm [&>th]:text-dark [&>th]:dark:text-white [&>th]:text-center [&>th]:flex-1">
              <TableHead className="!text-left ">
                SI.NO
              </TableHead>
              <TableHead className="!text-center">Name</TableHead>
              <TableHead className="!text-center">Email</TableHead>
              <TableHead className="!text-center">Role</TableHead>
              <TableHead className="!text-center">Phone</TableHead>
              <TableHead className="!text-center">Status</TableHead>
              <TableHead className="!text-right xl:pr-7.5">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-dark dark:text-white">
                  Loading...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-dark dark:text-white">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user, index) => (
                <TableRow
                  key={user._id}
                  className="border-[#eee] text-center text-base font-normal text-dark dark:border-dark-3 dark:text-white [&>td]:py-5 [&>td]:flex-1"
                >
                  <TableCell className="!text-left xl:pl-7.5">
                    <p className="text-base font-normal text-dark dark:text-white">
                      {(currentPage - 1) * 10 + index + 1}
                    </p>
                  </TableCell>
                  <TableCell className="!text-center">
                    <p className="text-base font-normal text-dark dark:text-white">
                      {user.name}
                    </p>
                  </TableCell>
                  <TableCell className="!text-center">
                    <p className="text-base font-normal text-dark dark:text-white">
                      {user.email}
                    </p>
                  </TableCell>
                  <TableCell className="!text-center">
                    <p className="text-base font-normal text-dark dark:text-white">
                      {getRoleName(user.role_names)}
                    </p>
                  </TableCell>
                  <TableCell className="!text-center">
                    <p className="text-base font-normal text-dark dark:text-white">
                      {user.number}
                    </p>
                  </TableCell>
                  <TableCell className="!text-center">
                    <span
                      className={`inline-flex rounded-full px-3.5 py-1 text-base font-normal ${
                        user.status
                          ? "bg-[#219653]/[0.08] text-[#219653]"
                          : "bg-[#DC3545]/[0.08] text-[#DC3545]"
                      }`}
                    >
                      {user.status ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="!text-right xl:pr-7.5">
                    <div className="flex items-center justify-end gap-x-4">
                      {permission?.can_view && (
                        <button
                          onClick={() => router.push(`/management/users/${user.user_id}`)}
                          className="inline-flex items-center justify-center text-primary hover:text-opacity-80"
                          title="View user"
                        >
                          <EyeIcon />
                        </button>
                      )}
                      {permission?.can_update && (
                        <button
                          onClick={() => router.push(`/management/users/${user.user_id}/edit`)}
                          className="inline-flex items-center justify-center text-primary hover:text-opacity-80"
                          title="Edit user"
                        >
                          <PencilSquareIcon />
                        </button>
                      )}
                      {permission?.can_delete && (
                        <button
                          onClick={() => handleDelete(user._id, user.name)}
                          className="inline-flex items-center justify-center text-red-500 hover:text-red-700"
                          title="Delete user"
                        >
                          <TrashIcon />
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
