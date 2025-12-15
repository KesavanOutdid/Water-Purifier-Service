"use client";

import { useEffect, useState } from "react";
import {
  CallIcon,
  EmailIcon,
  UserIcon,
} from "@/assets/icons";
import InputGroup from "@/components/FormElements/InputGroup";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { apiCall } from "@/lib/api-client";
import { useAuth } from "@/context/auth";
import Swal from "sweetalert2";

interface ProfileData {
  name: string;
  email: string;
  number: string | null;
  password: string;
  status: boolean;
}

interface ErrorsType {
  name?: string;
  email?: string;
  number?: string;
  password?: string;
}

export default function SettingsPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [formData, setFormData] = useState<ProfileData>({
    name: "",
    email: "",
    number: null,
    password: "",
    status: true,
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [initialFormData, setInitialFormData] = useState<ProfileData | null>(null);
  const [errors, setErrors] = useState<ErrorsType>({});

  useEffect(() => {
    if (!authLoading && user?.user_id) {
      fetchProfileData();
    } else if (!authLoading && !user?.user_id) {
      setLoading(false);
    }
  }, [authLoading, user?.user_id]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);

      if (!user?.user_id) {
        setLoading(false);
        return;
      }

      const data = await apiCall<any>(
        `/api/admin/profile?profileId=${user.user_id}`
      );

      const profileData: ProfileData = {
        name: data.name || "",
        email: data.email || "",
        number: data.number || null,
        password: data.password || "",
        status: data.status !== undefined ? data.status : true,
      };

      setFormData(profileData);
      setInitialFormData({ ...profileData });
    } catch (error) {
      Swal.fire("Error", "Failed to load profile", "error");
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = (): boolean => {
    if (!initialFormData) return false;

    return (
      formData.name !== initialFormData.name ||
      formData.email !== initialFormData.email ||
      formData.number !== initialFormData.number ||
      formData.password !== initialFormData.password ||
      formData.status !== initialFormData.status
    );
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "number") {
      const numberOnly = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({
        ...prev,
        number: numberOnly,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasChanges()) {
      Swal.fire("Info", "No changes were made", "info");
      return;
    }

    try {
      setSubmitting(true);

      const updateBody = {
        name: formData.name,
        number: formData.number || "",
        status: formData.status,
        password: formData.password,
      };

      await apiCall(`/api/admin/profile`, {
        method: "PUT",
        body: JSON.stringify(updateBody),
      });

      setInitialFormData({ ...formData });

      Swal.fire("Success", "Profile updated successfully", "success");
    } catch (error) {
      Swal.fire("Error", "Failed to update profile", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <p>Please login to access settings</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1080px]">
      <h1 className="mb-6 text-body-1xlg font-bold text-dark">SETTINGS</h1>

      <div className="flex justify-center">
        <div className="w-full max-w-4xl">
          <ShowcaseSection title="Personal Information" className="!p-7">
            <form onSubmit={handleSubmit}>
              <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                <InputGroup
                  className="w-full sm:w-1/2"
                  type="text"
                  name="name"
                  label="Full Name"
                  placeholder="John Doe"
                  value={formData.name}
                  handleChange={handleChange}
                  icon={<UserIcon />}
                  iconPosition="left"
                  height="sm"
                />

                <InputGroup
                  className="w-full sm:w-1/2"
                  type="text"
                  name="number"
                  label="Phone Number"
                  placeholder="1234567890"
                  value={formData.number || ""}
                  handleChange={handleChange}
                  icon={<CallIcon />}
                  iconPosition="left"
                  height="sm"
                  maxLength="10"
                />
              </div>

              <InputGroup
                className="mb-5.5"
                type="email"
                name="email"
                label="Email Address"
                placeholder="john@example.com"
                value={formData.email}
                handleChange={handleChange}
                icon={<EmailIcon />}
                iconPosition="left"
                height="sm"
                disabled
              />

              <InputGroup
                className="mb-5.5"
                type="text"
                name="password"
                label="Password"
                placeholder="Enter password"
                value={formData.password}
                handleChange={handleChange}
                icon={<UserIcon />}
                iconPosition="left"
                height="sm"
                autoComplete="current-password" // ✅ Enable autofill
              />

              <div className="flex justify-end gap-3">
                <button
                  className="rounded-lg border px-6 py-[7px]"
                  type="button"
                  onClick={() => {
                    setFormData(initialFormData || formData);
                    setErrors({});
                  }}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  className="rounded-lg bg-primary px-6 py-[7px] text-gray-2 hover:bg-opacity-90 disabled:opacity-50"
                  type="submit"
                  disabled={submitting || !hasChanges()}
                >
                  {submitting ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </ShowcaseSection>
        </div>
      </div>
    </div>
  );
}
