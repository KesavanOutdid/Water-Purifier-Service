const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://192.168.0.6:9000";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
}

export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
  returnFullResponse: boolean = false
): Promise<T | ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  if (token) {
    (defaultHeaders as any).Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  const responseData: ApiResponse<T> = await response.json();

  if (!response.ok) {
    throw new Error(responseData.message || `API Error: ${response.statusText}`);
  }
  
  if (!responseData.success) {
    throw new Error(responseData.message || "API request failed");
  }

  return returnFullResponse ? responseData : responseData.data;
}
