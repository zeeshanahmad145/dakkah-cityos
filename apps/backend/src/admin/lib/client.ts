import Medusa from "@medusajs/js-sdk";

export const sdk = new Medusa({
  baseUrl: "/",
  auth: {
    type: "session",
  },
});

// Helper to get auth headers
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("medusa_auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Custom client with HTTP methods for admin hooks
export const client = {
  ...sdk,
  async get<T>(url: string): Promise<{ data: T }> {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      credentials: "include",
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return { data };
  },
  async post<T>(url: string, body?: unknown): Promise<{ data: T }> {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return { data };
  },
  async put<T>(url: string, body?: unknown): Promise<{ data: T }> {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return { data };
  },
  async delete<T>(url: string): Promise<{ data: T }> {
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      credentials: "include",
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json().catch(() => ({}));
    return { data: data as T };
  },
};
