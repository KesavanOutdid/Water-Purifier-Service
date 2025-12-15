"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { apiCall } from "@/lib/api-client";

interface User {
  id: string;
  user_id: string;
  name: string;
  email: string;
  roles: number[];
  role_names: string[];
  number: string;
  created_at: string;
  modified_at: string;
}

export interface Permission {
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

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  permissions: Permission[];
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  refreshPermissions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPermissions = async (roleIds: number[]) => {
    try {
      const idsParam = roleIds.join(",");
      const permissions = await apiCall<Permission[]>(
        `/api/admin/permissions/roles?ids=${idsParam}`,
        {
          method: "GET",
        }
      );

      setPermissions(permissions);
      localStorage.setItem("permissions", JSON.stringify(permissions));
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
      setPermissions([]);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedAuth = localStorage.getItem("isAuthenticated");
        const storedUser = localStorage.getItem("user");
        const storedPermissions = localStorage.getItem("permissions");

        if (storedAuth === "true" && storedUser) {
          const parsedUser = JSON.parse(storedUser) as User;
          setIsAuthenticated(true);
          setUser(parsedUser);
          
          if (storedPermissions && storedPermissions !== "undefined") {
            try {
              setPermissions(JSON.parse(storedPermissions));
            } catch {
              await fetchPermissions(parsedUser.roles);
            }
          } else {
            await fetchPermissions(parsedUser.roles);
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setPermissions([]);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setIsAuthenticated(false);
        setUser(null);
        setPermissions([]);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    interface LoginResponse {
      token: string;
      user: User;
    }

    const response = await apiCall<LoginResponse>("/api/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    setIsAuthenticated(true);
    setUser(response.user);
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("user", JSON.stringify(response.user));
    localStorage.setItem("authToken", response.token);

    await fetchPermissions(response.user.roles);
  };

  const logout = async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
    setIsAuthenticated(false);
    setUser(null);
    setPermissions([]);
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    localStorage.removeItem("permissions");
  };

  const refreshPermissions = async () => {
    if (user) {
      await fetchPermissions(user.roles);
    }
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, permissions, login, logout, isLoading, refreshPermissions }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
