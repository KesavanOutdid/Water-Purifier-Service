"use client";

import { EmailIcon, PasswordIcon, EyeIcon, EyeOffIcon } from "@/assets/icons";
import { useAuth } from "@/context/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import InputGroup from "@/components/FormElements/InputGroup";
import { Checkbox } from "@/components/FormElements/checkbox";

export default function SignIn() {
  const router = useRouter();
  const { login } = useAuth();
  const [data, setData] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({
      ...data,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(data.email, data.password);

      if (data.remember) {
        localStorage.setItem("rememberMe", "true");
      }

      router.push("/");
    } catch (error) {
      console.error("Login failed:", error);
      setError(error instanceof Error ? error.message : "Login failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-2 dark:bg-[#020d1a] px-4">
      <div className="w-full rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card max-w-lg">
        <div className="w-full p-6 sm:p-10 xl:p-12">
          
          {/* LOGO */}
          <Link className=" flex justify-center" href="/">
            <Image
              src={"/images/logo/servicelogo.png"}
              alt="Logo"
              width={120}
              height={64}
            />
          </Link>

          {/* WELCOME TITLE */}
          <h2 className="text-center text-xl text-dark dark:text-white ">
            Welcome Back!
          </h2>

          <form onSubmit={handleSubmit}>
            <InputGroup
              type="email"
              label={<>Email <span className="text-red-600">*</span></>}
              className="mb-4 [&_input]:py-[15px]"
              placeholder="Enter your email"
              name="email"
              handleChange={handleChange}
              value={data.email}
              icon={<EmailIcon />}
            />

            {/* PASSWORD INPUT */}
            <div className="mb-5">
              <label className="text-body-sm font-medium text-dark dark:text-white">
                Password <span className="text-red-600">*</span>
              </label>
              <div className="relative mt-3">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  onChange={handleChange}
                  value={data.password}
                  required
                  className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5.5 py-3 pr-12 text-dark placeholder:text-dark-6 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4.5 top-1/2 -translate-y-1/2 text-dark-6 hover:text-dark dark:text-dark-6 dark:hover:text-white transition"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* REMEMBER ME */}
            <div className="mb-6 flex items-center justify-between gap-2 py-2 font-medium">
              <Checkbox
                label="Remember me"
                name="remember"
                withIcon="check"
                minimal
                radius="md"
                onChange={(e) =>
                  setData({
                    ...data,
                    remember: e.target.checked,
                  })
                }
              />
            </div>

            {/* ERROR MESSAGE */}
            {error && (
              <div className="mb-4 rounded-lg bg-red-100 p-3 text-red-700 dark:bg-red-900 dark:text-red-100">
                {error}
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <div className="mb-4.5">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary p-4 font-medium text-white transition hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sign In
                {loading && (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent dark:border-primary dark:border-t-transparent" />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
