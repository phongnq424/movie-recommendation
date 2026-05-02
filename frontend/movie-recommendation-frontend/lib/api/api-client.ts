const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type RequestOptions = RequestInit & {
    auth?: boolean;
};

export async function apiClient<T>(
    path: string,
    options: RequestOptions = {}
): Promise<T> {
    if (!API_BASE_URL) {
        throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(data?.message || "API request failed");
    }

    return data as T;
}