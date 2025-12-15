"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiCall } from "@/lib/api-client";
import { useAuth } from "@/context/auth";
import Swal from "sweetalert2";

interface Model {
  _id: string;
  uid: string;
  name: string;
  quantity: number;
  status: boolean;
}

interface Distributor {
  _id: string;
  user_id: string;
  name: string;
  email: string;
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

interface ServiceFormData {
  customer_name: string;
  address: AddressData;
  phone: string;
  email: string;
  service_type: number;
  model_id: string;
  distributor_id: string;
  local_distributor_id: string;
  created_by: string;
}

interface FormErrors {
  customer_name?: string;
  phone?: string;
  email?: string;
  model_id?: string;
  distributor_id?: string;
  local_distributor_id?: string;
  address?: Partial<AddressData>;
}

export default function AddServiceTask() {
  const router = useRouter();
  const { user } = useAuth();
  const [models, setModels] = useState<Model[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [localDistributors, setLocalDistributors] = useState<Distributor[]>([]);
  const [distributorName, setDistributorName] = useState<string>("");
  const [localDistributorName, setLocalDistributorName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loadingLocalDist, setLoadingLocalDist] = useState(false);
  const [formData, setFormData] = useState<ServiceFormData>({
    customer_name: "",
    address: {
      doorno: "",
      street: "",
      city: "",
      district: "",
      state: "",
      country: "",
      pincode: "",
    },
    phone: "",
    email: "",
    service_type: 2,
    model_id: "",
    distributor_id: "",
    local_distributor_id: "",
    created_by: user?.email || "",
  });

  const isSuperAdmin = user?.role_names?.includes("Super Admin");
  const isLocalDistributor = user?.role_names?.includes("Local Distributor");

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (user?.email) {
      setFormData((prev) => ({
        ...prev,
        created_by: user.email,
      }));
    }

    if (isLocalDistributor && user?.distributor) {
      setFormData((prev) => ({
        ...prev,
        distributor_id: user.distributor,
        local_distributor_id: user.user_id || "",
      }));
      
      if (user?.distributor_name) {
        setDistributorName(user.distributor_name);
      }
      
      if (user?.name) {
        setLocalDistributorName(user.name);
      }
    }
  }, [user]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [modelsRes, distributorsRes] = await Promise.all([
        apiCall<any>(`/api/admin/models`, {}, true),
        isSuperAdmin ? apiCall<any>(`/api/admin/users`, {}, true) : Promise.resolve(null),
      ]);

      if (modelsRes && modelsRes.data && Array.isArray(modelsRes.data)) {
        setModels(modelsRes.data);
      }

      if (isSuperAdmin && distributorsRes && distributorsRes.data && Array.isArray(distributorsRes.data)) {
        const filteredDistributors = distributorsRes.data.filter((u: any) =>
          u.role_names?.includes("Distributor")
        );
        setDistributors(filteredDistributors);
      }
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
      Swal.fire("Error", "Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDistributorChange = async (distributorId: string) => {
    setFormData((prev) => ({
      ...prev,
      distributor_id: distributorId,
      local_distributor_id: "",
    }));

    if (distributorId) {
      try {
        setLoadingLocalDist(true);
        const response = await apiCall<any>(
          `/api/admin/users?user_id=${distributorId}`,
          {},
          true
        );

        if (response && response.data && Array.isArray(response.data)) {
          const filteredLocalDist = response.data.filter((u: any) =>
            u.role_names?.includes("Local Distributor")
          );
          setLocalDistributors(filteredLocalDist);
        }
      } catch (error) {
        console.error("Failed to fetch local distributors:", error);
        setLocalDistributors([]);
      } finally {
        setLoadingLocalDist(false);
      }
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[+]?[\d\s\-()]{10,}$/;
    return phoneRegex.test(phone);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.customer_name.trim()) {
      newErrors.customer_name = "Customer name is required";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone is required";
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = "Invalid phone number";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Invalid email address";
    }

    if (!formData.model_id) {
      newErrors.model_id = "Model is required";
    }

    if (isSuperAdmin && !formData.distributor_id) {
      newErrors.distributor_id = "Distributor is required";
    }

    if (isSuperAdmin && !formData.local_distributor_id) {
      newErrors.local_distributor_id = "Local Distributor is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    field?: string
  ) => {
    const { name, value } = e.target;

    if (field === "address") {
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [name]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      Swal.fire("Error", "Please fix the validation errors", "error");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        customer_name: formData.customer_name,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        service_type: formData.service_type,
        model_id: formData.model_id,
        distributor_id: formData.distributor_id,
        local_distributor_id: formData.local_distributor_id,
        created_by: formData.created_by,
      };

      await apiCall("/api/admin/tasks", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      Swal.fire("Success", "Service task created successfully", "success");
      router.push("/management/service");
    } catch (error) {
      console.error("Failed to create service task:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create service task";
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
          ADD NEW SERVICE TASK
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
            Customer Information
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-5.5 sm:grid-cols-2">
              <div>
                <label className="text-base font-semibold text-dark dark:text-white">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  placeholder="Enter customer name"
                  className="mt-2 w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                />
                {errors.customer_name && (
                  <p className="mt-1 text-xs text-red-500">{errors.customer_name}</p>
                )}
              </div>

              <div>
                <label className="text-base font-semibold text-dark dark:text-white">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  className="mt-2 w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                />
                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
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
                  className="mt-2 w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
              </div>

              <div>
                <label className="text-base font-semibold text-dark dark:text-white">
                  Model <span className="text-red-500">*</span>
                </label>
                <select
                  name="model_id"
                  value={formData.model_id}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                >
                  <option value="">Select a model</option>
                  {models.map((model) => (
                    <option key={model._id} value={model.uid}>
                      {model.name}
                    </option>
                  ))}
                </select>
                {errors.model_id && (
                  <p className="mt-1 text-xs text-red-500">{errors.model_id}</p>
                )}
              </div>
            </div>
          </form>
        </div>

        <div className="rounded-[10px] bg-white px-7.5 pb-7.5 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card">
          <h2 className="mb-6 text-body-lg font-bold text-dark dark:text-white">
            Address Information
          </h2>

          <form>
            <div className="grid grid-cols-1 gap-5.5 sm:grid-cols-2">
              <div>
                <label className="text-base font-semibold text-dark dark:text-white">
                  Door Number
                </label>
                <input
                  type="text"
                  name="doorno"
                  value={formData.address.doorno}
                  onChange={(e) => handleChange(e, "address")}
                  placeholder="Enter door number"
                  className="mt-2 w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
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
                  onChange={(e) => handleChange(e, "address")}
                  placeholder="Enter street"
                  className="mt-2 w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="text-base font-semibold text-dark dark:text-white">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.address.city}
                  onChange={(e) => handleChange(e, "address")}
                  placeholder="Enter city"
                  className="mt-2 w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="text-base font-semibold text-dark dark:text-white">
                  District
                </label>
                <input
                  type="text"
                  name="district"
                  value={formData.address.district}
                  onChange={(e) => handleChange(e, "address")}
                  placeholder="Enter district"
                  className="mt-2 w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
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
                  onChange={(e) => handleChange(e, "address")}
                  placeholder="Enter state"
                  className="mt-2 w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="text-base font-semibold text-dark dark:text-white">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.address.country}
                  onChange={(e) => handleChange(e, "address")}
                  placeholder="Enter country"
                  className="mt-2 w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
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
                  onChange={(e) => handleChange(e, "address")}
                  placeholder="Enter pincode"
                  className="mt-2 w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                />
              </div>
            </div>
          </form>
        </div>

        {isSuperAdmin && (
          <div className="rounded-[10px] bg-white px-7.5 pb-7.5 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card">
            <h2 className="mb-6 text-body-lg font-bold text-dark dark:text-white">
              Distribution Information
            </h2>

            <form>
              <div className="grid grid-cols-1 gap-5.5 sm:grid-cols-2">
                <div>
                  <label className="text-base font-semibold text-dark dark:text-white">
                    Distributor <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="distributor_id"
                    value={formData.distributor_id}
                    onChange={(e) => handleDistributorChange(e.target.value)}
                    className="mt-2 w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                  >
                    <option value="">Select a distributor</option>
                    {distributors.map((dist) => (
                      <option key={dist._id} value={dist.user_id}>
                        {dist.name}
                      </option>
                    ))}
                  </select>
                  {errors.distributor_id && (
                    <p className="mt-1 text-xs text-red-500">{errors.distributor_id}</p>
                  )}
                </div>

                <div>
                  <label className="text-base font-semibold text-dark dark:text-white">
                    Local Distributor <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="local_distributor_id"
                    value={formData.local_distributor_id}
                    onChange={handleChange}
                    disabled={!formData.distributor_id || loadingLocalDist}
                    className="mt-2 w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-dark outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary dark:disabled:bg-dark-3"
                  >
                    <option value="">
                      {loadingLocalDist
                        ? "Loading..."
                        : "Select a local distributor"}
                    </option>
                    {localDistributors.map((localDist) => (
                      <option key={localDist._id} value={localDist.user_id}>
                        {localDist.name}
                      </option>
                    ))}
                  </select>
                  {errors.local_distributor_id && (
                    <p className="mt-1 text-xs text-red-500">{errors.local_distributor_id}</p>
                  )}
                </div>
              </div>
            </form>
          </div>
        )}

        {isLocalDistributor && (
          <div className="rounded-[10px] bg-white px-7.5 pb-7.5 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card">
            <h2 className="mb-6 text-body-lg font-bold text-dark dark:text-white">
              Distribution Information
            </h2>

            <div className="grid grid-cols-1 gap-5.5 sm:grid-cols-2">
              <div>
                <label className="text-base font-semibold text-dark dark:text-white">
                  Distributor
                </label>
                <input
                  type="text"
                  value={distributorName}
                  disabled
                  className="mt-2 w-full rounded-lg border-[1.5px] border-stroke bg-gray-100 px-5 py-3 text-dark outline-none disabled:cursor-not-allowed dark:border-dark-3 dark:bg-dark-3 dark:text-white"
                />
              </div>

              <div>
                <label className="text-base font-semibold text-dark dark:text-white">
                  Local Distributor
                </label>
                <input
                  type="text"
                  value={localDistributorName}
                  disabled
                  className="mt-2 w-full rounded-lg border-[1.5px] border-stroke bg-gray-100 px-5 py-3 text-dark outline-none disabled:cursor-not-allowed dark:border-dark-3 dark:bg-dark-3 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

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
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Creating..." : "Create Task"}
          </button>
        </div>
      </div>
    </>
  );
}
