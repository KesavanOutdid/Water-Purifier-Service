"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiCall } from "@/lib/api-client";
import { useAuth } from "@/context/auth";
import Swal from "sweetalert2";

interface Role {
  _id: string;
  role_id: number;
  role_name: string;
}

interface AddressData {
  doorno: string;
  street: string;
  city: string;
  district: string;
  state: string;
  country: string;
  pincode: string;
}

interface UserFormData {
  name: string;
  email: string;
  password?: string;
  roles: number[];
  number: string;
  status: boolean;
  address: AddressData;
  distributor?: string;
  local_distributor?: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  number?: string;
  address?: { [key: string]: string };
}

export default function EditUser() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;
  const { user } = useAuth();

  const [roles, setRoles] = useState<Role[]>([]);
  const [distributors, setDistributors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [initialFormData, setInitialFormData] = useState<UserFormData | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    password: "",
    roles: [3],
    number: "",
    status: true,
    address: {
      doorno: "",
      street: "",
      city: "",
      district: "",
      state: "",
      country: "India",
      pincode: "",
    },
  });

  useEffect(() => {
    if (userId) {
      Promise.all([fetchRoles(), fetchUserData()]);
    }
  }, [userId]);

  useEffect(() => {
    if (user?.email) {
      const userRoles = user?.roles || [];
      fetchDistributors(formData.roles);
    }
  }, [user?.email, formData.roles]);

  const fetchRoles = async () => {
    try {
      const response = await apiCall<Role[]>(`/api/admin/roles?page=1&limit=100`);

      if (Array.isArray(response)) {
        setRoles(response);
      } else if (response && (response as any).data) {
        setRoles(Array.isArray((response as any).data) ? (response as any).data : []);
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error);
    }
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const data = await apiCall<any>(`/api/admin/users/${userId}`);
      console.log("User data received:", data);

      const userData: UserFormData = {
        name: data.name || "",
        email: data.email || "",
        password: data.password || "",
        roles: Array.isArray(data.roles) ? data.roles : [3],
        number: data.number || "",
        status: data.status !== undefined ? data.status : true,
        address: data.address ? {
          doorno: data.address.doorno ?? "",
          street: data.address.street ?? "",
          city: data.address.city ?? "",
          district: data.address.district ?? "",
          state: data.address.state ?? "",
          country: data.address.country ?? "India",
          pincode: data.address.pincode ?? "",
        } : {
          doorno: "",
          street: "",
          city: "",
          district: "",
          state: "",
          country: "India",
          pincode: "",
        },
        distributor: data.distributor || "",
        local_distributor: data.local_distributor || "",
      };

      setFormData(userData);
      setInitialFormData(userData);
    } catch (error) {
      console.error("Failed to fetch user:", error);
      Swal.fire("Error", "Failed to load user data. Invalid user ID.", "error");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const fetchDistributors = async (roleIds: number[] = formData.roles) => {
    try {
      const userRoles = user?.roles || [];
      const userId = user?.user_id;
      
      let url = `/api/admin/users?limit=1000`;
      if (!userRoles.includes(1) && userId) {
        url = `/api/admin/users?user_id=${userId}&limit=1000`;
      }
      
      const response = await apiCall<any>(url, {}, true);
      
      if (response && response.data && Array.isArray(response.data)) {
        let filtered: any[] = [];
        const userRoles = user?.roles || [];
        
        if (userRoles.includes(1)) {
          if (roleIds.includes(3)) {
            filtered = response.data.filter((u: any) => 
              u.roles && u.roles.includes(2)
            );
          } else if (roleIds.includes(4)) {
            filtered = response.data.filter((u: any) => 
              u.roles && (u.roles.includes(2) || u.roles.includes(3))
            );
          } else {
            filtered = response.data;
          }
        } else if (userRoles.includes(2) && !userRoles.includes(1)) {
          filtered = response.data.filter((u: any) => 
            u.user_id === userId || (u.roles?.includes(3) && u.distributor === userId)
          );
          if (filtered.length === 0 && user) {
            filtered = [{
              user_id: user.user_id,
              name: user.name,
              email: user.email,
              roles: user.roles
            }];
          }
        } else if (userRoles.includes(3)) {
          const currentUser = response.data.find((u: any) => u.user_id === userId);
          filtered = response.data.filter((u: any) => 
            u.user_id === userId || (u.user_id === currentUser?.distributor)
          );
        } else if (roleIds.includes(3)) {
          filtered = response.data.filter((u: any) => 
            u.roles && u.roles.includes(2)
          );
        } else if (roleIds.includes(4)) {
          filtered = response.data.filter((u: any) => 
            u.roles && (u.roles.includes(2) || u.roles.includes(3))
          );
        }
        
        setDistributors(filtered);
      } else {
        setDistributors([]);
      }
    } catch (error) {
      console.error("Failed to fetch distributors:", error);
      setDistributors([]);
    }
  };

  const hasChanges = (): boolean => {
    if (!initialFormData) return false;

    const currentData = {
      name: formData.name,
      email: formData.email,
      roles: formData.roles,
      number: formData.number,
      status: formData.status,
      address: formData.address,
      password: formData.password,
      distributor: formData.distributor,
      local_distributor: formData.local_distributor,
    };

    const initialData = {
      name: initialFormData.name,
      email: initialFormData.email,
      roles: initialFormData.roles,
      number: initialFormData.number,
      status: initialFormData.status,
      address: initialFormData.address,
      password: initialFormData.password,
      distributor: initialFormData.distributor,
      local_distributor: initialFormData.local_distributor,
    };

    return JSON.stringify(currentData) !== JSON.stringify(initialData);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.length > 50) {
      newErrors.name = "Name must be 50 characters or less";
    } else if (!/^[a-zA-Z\s]+$/.test(formData.name)) {
      newErrors.name = "Name can only contain letters and spaces";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (formData.password && formData.password.trim()) {
      if (formData.password.length < 4) {
        newErrors.password = "Password must be at least 4 characters";
      } else if (formData.password.length > 50) {
        newErrors.password = "Password must be 50 characters or less";
      } else if (!/\d/.test(formData.password)) {
        newErrors.password = "Password must contain at least one number";
      }
    }

    if (formData.number && formData.number.trim()) {
      const digitsOnly = formData.number.replace(/\D/g, "");
      if (digitsOnly.length !== 10) {
        newErrors.number = "Phone number must contain exactly 10 digits";
      }
    }

    const addressErrs: { [key: string]: string } = {};
    
    if (formData.address.street.trim() && formData.address.street.length > 100) {
      addressErrs.street = "Street must be 100 characters or less";
    }

    if (formData.address.city.trim() && formData.address.city.length > 30) {
      addressErrs.city = "City must be 30 characters or less";
    }

    if (formData.address.state.trim() && formData.address.state.length > 30) {
      addressErrs.state = "State must be 30 characters or less";
    }

    if (formData.address.pincode.trim() && !/^[0-9]{6}$/.test(formData.address.pincode)) {
      addressErrs.pincode = "Pincode must be exactly 6 digits";
    }

    if (Object.keys(addressErrs).length > 0) {
      newErrors.address = addressErrs;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRoleChange = (roleId: number, isChecked: boolean) => {
    let updatedRoles: number[];
    
    if (isChecked) {
      updatedRoles = [...formData.roles, roleId].sort((a, b) => a - b);
    } else {
      updatedRoles = formData.roles.filter(r => r !== roleId);
    }

    const userRoles = user?.roles || [];
    let distributorId: string | undefined = undefined;
    let localDistributorId: string | undefined = undefined;
    
    if (userRoles.includes(2)) {
      distributorId = user?.user_id;
    } else if (userRoles.includes(3)) {
      distributorId = user?.distributor;
    }
    
    if (userRoles.includes(3) && updatedRoles.includes(4)) {
      localDistributorId = user?.user_id;
    }

    setFormData({
      ...formData,
      roles: updatedRoles,
      distributor: distributorId,
      local_distributor: localDistributorId,
    });
    
    if (updatedRoles.length > 0) {
      fetchDistributors(updatedRoles);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    isAddress: boolean = false
  ) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === "checkbox";

    if (isAddress) {
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [name]: value,
        },
      });
    } else {
      if (name === "status") {
        setFormData({ ...formData, [name]: isCheckbox ? (e.target as any).checked : value === "true" });
      } else if (name === "number") {
        const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
        setFormData({ ...formData, [name]: digitsOnly });
      } else {
        setFormData({ ...formData, [name]: value });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasChanges()) {
      Swal.fire("Info", "No changes were made to the user", "info");
      return;
    }

    if (!validateForm()) {
      Swal.fire("Error", "Please fix the validation errors", "error");
      return;
    }

    try {
      setSubmitting(true);

      const updateData: any = {
        name: formData.name,
        email: formData.email,
        roles: formData.roles,
        number: formData.number,
        status: formData.status,
        address: formData.address,
        modified_by: user?.email || "",
      };

      if (formData.password && formData.password.trim()) {
        updateData.password = formData.password;
      }

      if (formData.distributor) {
        updateData.distributor = formData.distributor;
      }

      if (formData.local_distributor) {
        updateData.local_distributor = formData.local_distributor;
      }

      await apiCall(`/api/admin/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify(updateData),
      });

      Swal.fire("Success", "User updated successfully", "success");
      router.push("/management/users");
    } catch (error) {
      console.error("Failed to update user:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update user";
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
          EDIT USER
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
            User Information
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-5.5 grid grid-cols-1 gap-5.5 sm:grid-cols-2">
              <div>
                <label className="text-base font-semibold text-dark dark:text-white">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  maxLength={50}
                  className={`mt-2 w-full rounded-lg border-[1.5px] bg-transparent px-5 py-3 text-dark outline-none transition dark:bg-dark-2 dark:text-white ${
                    errors.name
                      ? "border-red-500 focus:border-red-500 dark:border-red-500"
                      : "border-stroke focus:border-primary dark:border-dark-3 dark:focus:border-primary"
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {formData.name.length}/50 characters
                </p>
              </div>

              <div>
                <label className="text-base font-semibold text-dark dark:text-white">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  className={`mt-2 w-full rounded-lg border-[1.5px] bg-transparent px-5 py-3 text-dark outline-none transition dark:bg-dark-2 dark:text-white ${
                    errors.email
                      ? "border-red-500 focus:border-red-500 dark:border-red-500"
                      : "border-stroke focus:border-primary dark:border-dark-3 dark:focus:border-primary"
                  }`}
                  disabled={true}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="text-base font-semibold text-dark dark:text-white">
                  Password
                </label>
                <input
                  type="text"
                  name="password"
                  value={formData.password || ""}
                  onChange={handleChange}
                  placeholder="Enter new password (min 4 chars, must contain a number)"
                  maxLength={50}
                  className={`mt-2 w-full rounded-lg border-[1.5px] bg-transparent px-5 py-3 text-dark outline-none transition dark:bg-dark-2 dark:text-white ${
                    errors.password
                      ? "border-red-500 focus:border-red-500 dark:border-red-500"
                      : "border-stroke focus:border-primary dark:border-dark-3 dark:focus:border-primary"
                  }`}
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {(formData.password || "").length}/50 characters
                </p>
              </div>

              <div>
                <label className="text-base font-semibold text-dark dark:text-white">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="number"
                  value={formData.number}
                  onChange={handleChange}
                  placeholder="Enter phone number (10 digits)"
                  maxLength={10}
                  className={`mt-2 w-full rounded-lg border-[1.5px] bg-transparent px-5 py-3 text-dark outline-none transition dark:bg-dark-2 dark:text-white ${
                    errors.number
                      ? "border-red-500 focus:border-red-500 dark:border-red-500"
                      : "border-stroke focus:border-primary dark:border-dark-3 dark:focus:border-primary"
                  }`}
                />
                {errors.number && (
                  <p className="mt-1 text-xs text-red-500">{errors.number}</p>
                )}
              </div>

              <div>
                <label className="text-base font-semibold text-dark dark:text-white">
                  Role <span className="text-red-500">*</span>
                </label>
                <div className="mt-2 rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2 dark:border-dark-3 dark:bg-dark-2">
                  <div className="space-y-2">
                    {roles
                      .filter((role) => {
                        const userRoles = user?.roles || [];
                        
                        if (userRoles.includes(1)) {
                          return true;
                        } else if (userRoles.includes(2)) {
                          return role.role_id === 3 || role.role_id === 4;
                        } else if (userRoles.includes(3)) {
                          return role.role_id === 4;
                        }
                        return false;
                      })
                      .map((role) => (
                        <div
                          key={role.role_id}
                          className="flex items-center rounded-lg px-1 py-1.5 transition hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <input
                            type="checkbox"
                            id={`role_${role.role_id}`}
                            checked={formData.roles.includes(role.role_id)}
                            onChange={(e) => handleRoleChange(role.role_id, e.target.checked)}
                            className="h-5 w-5 cursor-pointer rounded border-[1.5px] border-stroke accent-primary dark:border-dark-3 dark:bg-dark-2"
                          />
                          <label
                            htmlFor={`role_${role.role_id}`}
                            className="ml-3 cursor-pointer text-sm font-medium text-dark dark:text-white"
                          >
                            {role.role_name}
                          </label>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-base font-semibold text-dark dark:text-white">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status ? "true" : "false"}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            {formData.roles.includes(3) && !formData.roles.includes(4) && user?.roles?.includes(1) && (
              <div>
                <label className="text-base font-semibold text-dark dark:text-white">
                  Distributor <span className="text-red-500">*</span>
                </label>
              
                <select
                  value={formData.distributor || ""}
                  onChange={(e) => setFormData({ ...formData, distributor: e.target.value })}
                  className="mt-2 w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                >
                  <option value="">-- Select Distributor --</option>
                  {distributors
                    .filter((dist) => dist.roles?.includes(2))
                    .map((dist) => (
                      <option key={dist.user_id} value={dist.user_id}>
                        {dist.name} ({dist.email}) - Distributor
                      </option>
                    ))}
                </select>
              </div>
            )}

            {formData.roles.includes(4) && (
              <>
                <div className="mb-5.5">
                  <label className="text-base font-semibold text-dark dark:text-white">
                    Distributor <span className="text-red-500">*</span>
                  </label>
               
                  <select
                    value={formData.distributor || ""}
                    onChange={(e) => setFormData({ ...formData, distributor: e.target.value })}
                    className="mt-2 w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                  >
                    <option value="">-- Select Distributor --</option>
                    {user?.roles?.includes(2) && (
                      <option key={user.user_id} value={user.user_id}>
                        {user.name} ({user.email}) - Distributor
                      </option>
                    )}
                    {user?.roles?.includes(3) && user?.distributor && (
                      <option key={user.distributor} value={user.distributor}>
                        {user.distributor_name} ({user.distributor_email || distributors.find(d => d.user_id === user.distributor)?.email || 'N/A'}) - Distributor
                      </option>
                    )}
                    {user?.roles?.includes(1) && distributors
                      .filter((dist) => dist.roles?.includes(2))
                      .map((dist) => (
                        <option key={dist.user_id} value={dist.user_id}>
                          {dist.name} ({dist.email}) - Distributor
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="text-base font-semibold text-dark dark:text-white">
                    Local Distributor <span className="text-red-500">*</span>
                  </label>
                 
                  <select
                    value={formData.local_distributor || ""}
                    onChange={(e) => setFormData({ ...formData, local_distributor: e.target.value })}
                    className="mt-2 w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                    disabled={user?.roles?.includes(3)}
                  >
                    <option value="">-- Select Local Distributor --</option>
                    {user?.roles?.includes(3) && user?.user_id === formData.local_distributor && (
                      <option key={user.user_id} value={user.user_id}>
                        {user.name} ({user.email}) - Local Distributor
                      </option>
                    )}
                    {distributors
                      .filter((dist) => 
                        dist.roles?.includes(3) && 
                        (formData.distributor ? dist.distributor === formData.distributor : true)
                      )
                      .map((dist) => (
                        <option key={dist.user_id} value={dist.user_id}>
                          {dist.name} ({dist.email}) - Local Distributor
                        </option>
                      ))}
                  </select>
                </div>
              </>
            )}

            <div className="mb-6 border-t border-stroke pt-6 dark:border-dark-3">
              <h3 className="mb-4 text-body-lg font-bold text-dark dark:text-white">
                Address
              </h3>

              <div className="rounded-lg border border-stroke p-5 dark:border-dark-3">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-base font-semibold text-dark dark:text-white">
                      Door Number
                    </label>
                    <input
                      type="text"
                      name="doorno"
                      value={formData.address.doorno}
                      onChange={(e) => handleChange(e, true)}
                      placeholder="Enter door number"
                      className="mt-2 w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="text-base font-semibold text-dark dark:text-white">
                      Street
                    </label>
                    <input
                      type="text"
                      name="street"
                      value={formData.address.street}
                      onChange={(e) => handleChange(e, true)}
                      placeholder="Enter street address"
                      maxLength={100}
                      className={`mt-2 w-full rounded-lg border-[1.5px] bg-transparent px-5 py-3 text-base text-dark outline-none transition dark:bg-dark-2 dark:text-white ${
                        errors.address?.street
                          ? "border-red-500 focus:border-red-500 dark:border-red-500"
                          : "border-stroke focus:border-primary dark:border-dark-3 dark:focus:border-primary"
                      }`}
                    />
                    {errors.address?.street && (
                      <p className="mt-1 text-xs text-red-500">{errors.address.street}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-base font-semibold text-dark dark:text-white">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.address.city}
                      onChange={(e) => handleChange(e, true)}
                      placeholder="Enter city"
                      maxLength={30}
                      className={`mt-2 w-full rounded-lg border-[1.5px] bg-transparent px-5 py-3 text-base text-dark outline-none transition dark:bg-dark-2 dark:text-white ${
                        errors.address?.city
                          ? "border-red-500 focus:border-red-500 dark:border-red-500"
                          : "border-stroke focus:border-primary dark:border-dark-3 dark:focus:border-primary"
                      }`}
                    />
                    {errors.address?.city && (
                      <p className="mt-1 text-xs text-red-500">{errors.address.city}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-base font-semibold text-dark dark:text-white">
                      District
                    </label>
                    <input
                      type="text"
                      name="district"
                      value={formData.address.district}
                      onChange={(e) => handleChange(e, true)}
                      placeholder="Enter district"
                      className="mt-2 w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="text-base font-semibold text-dark dark:text-white">
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.address.state}
                      onChange={(e) => handleChange(e, true)}
                      placeholder="Enter state"
                      maxLength={30}
                      className={`mt-2 w-full rounded-lg border-[1.5px] bg-transparent px-5 py-3 text-base text-dark outline-none transition dark:bg-dark-2 dark:text-white ${
                        errors.address?.state
                          ? "border-red-500 focus:border-red-500 dark:border-red-500"
                          : "border-stroke focus:border-primary dark:border-dark-3 dark:focus:border-primary"
                      }`}
                    />
                    {errors.address?.state && (
                      <p className="mt-1 text-xs text-red-500">{errors.address.state}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-base font-semibold text-dark dark:text-white">
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={formData.address.country}
                      onChange={(e) => handleChange(e, true)}
                      placeholder="Enter country"
                      className="mt-2 w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="text-base font-semibold text-dark dark:text-white">
                      Pincode
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.address.pincode}
                      onChange={(e) => handleChange(e, true)}
                      placeholder="Enter 6-digit pincode"
                      maxLength={6}
                      className={`mt-2 w-full rounded-lg border-[1.5px] bg-transparent px-5 py-3 text-base text-dark outline-none transition dark:bg-dark-2 dark:text-white ${
                        errors.address?.pincode
                          ? "border-red-500 focus:border-red-500 dark:border-red-500"
                          : "border-stroke focus:border-primary dark:border-dark-3 dark:focus:border-primary"
                      }`}
                    />
                    {errors.address?.pincode && (
                      <p className="mt-1 text-xs text-red-500">{errors.address.pincode}</p>
                    )}
                  </div>
                </div>
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
                disabled={submitting || !hasChanges()}
              >
                {submitting ? "Updating..." : "Update User"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
