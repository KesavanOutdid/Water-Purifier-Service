"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiCall } from "@/lib/api-client";
import { useAuth } from "@/context/auth";
import Swal from "sweetalert2";
import { EyeIcon, EyeOffIcon } from "@/assets/icons";

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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
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
        password: "",
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
    };

    const initialData = {
      name: initialFormData.name,
      email: initialFormData.email,
      roles: initialFormData.roles,
      number: initialFormData.number,
      status: initialFormData.status,
      address: initialFormData.address,
      password: initialFormData.password,
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
      if (name === "roles") {
        setFormData({
          ...formData,
          roles: [parseInt(value)],
        });
      } else if (name === "status") {
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
                <div className="relative mt-2">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password || ""}
                    onChange={handleChange}
                    placeholder="Enter new password (min 4 chars, must contain a number)"
                    maxLength={50}
                    className={`w-full rounded-lg border-[1.5px] bg-transparent px-5 py-3 pr-12 text-dark outline-none transition dark:bg-dark-2 dark:text-white ${
                      errors.password
                        ? "border-red-500 focus:border-red-500 dark:border-red-500"
                        : "border-stroke focus:border-primary dark:border-dark-3 dark:focus:border-primary"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4.5 top-1/2 -translate-y-1/2 text-dark-6 hover:text-dark dark:text-dark-6 dark:hover:text-white transition"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
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
                  Role
                </label>
                <select
                  name="roles"
                  value={formData.roles[0] || ""}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                >
                  {roles.map((role) => (
                    <option key={role.role_id} value={role.role_id}>
                      {role.role_name}
                    </option>
                  ))}
                </select>
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
