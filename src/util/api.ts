import { useState } from "react";
import { QueryClient, queryOptions, useQuery } from "@tanstack/react-query";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase_config";
import { authSliceActions } from "@/store/authSlice";
import { BASE_URL } from "@/util/constants";
import type {
  AuthCredentials,
  DeletingDataOptions,
  EditingDataOptions,
  FetchDataOptions,
  KeywordItem,
  SendingDataOptions,
} from "@/util/Types";

// ── TanStack Query Configuration ───────────────────────────────────

export const DEFAULT_QUERY_STALE_TIME = 1000 * 60 * 5;
export const DEFAULT_QUERY_GC_TIME = 1000 * 60 * 5;

export const DEFAULT_QUERY_OPTIONS = {
  staleTime: DEFAULT_QUERY_STALE_TIME,
  gcTime: DEFAULT_QUERY_GC_TIME,
} as const;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      ...DEFAULT_QUERY_OPTIONS,
    },
  },
});

export const keywordsQueryOptions = queryOptions<KeywordItem[]>({
  queryKey: ["keywords"],
  queryFn: ({ signal }) => fetchingData({ endpoint: "posts/keywords", signal }),
});

export function invalidateKeywordQueries() {
  queryClient.invalidateQueries({ queryKey: ["ignored-words"] });
  queryClient.invalidateQueries({ queryKey: ["keywords"] });
}

export interface UseDownloadQueryOptions {
  queryKey: readonly unknown[];
  endpoint: string;
  enabled?: boolean;
  refetchOnMount?: boolean;
  refetchOnReconnect?: boolean;
}

/**
 * Shared TanStack Query hook for endpoints that report streaming download progress.
 */
export function useDownloadQuery<TData>({
  queryKey,
  endpoint,
  enabled = true,
  refetchOnMount,
  refetchOnReconnect,
}: UseDownloadQueryOptions) {
  const [downloadProgress, setDownloadProgress] = useState(0);

  const query = useQuery<TData>({
    queryKey,
    queryFn: ({ signal }) => {
      setDownloadProgress(0);
      return fetchingData({
        endpoint,
        signal,
        progressCallBackFn: setDownloadProgress,
      });
    },
    enabled,
    refetchOnWindowFocus: false,
    refetchOnMount,
    refetchOnReconnect,
  });

  return { ...query, downloadProgress };
}

// ── HTTP, WebSocket & Auth Helpers ─────────────────────────────────

export function createAuthHeaders(
  token?: string | null,
  includeJsonContentType = true,
): Record<string, string> {
  const headers: Record<string, string> = {};
  if (includeJsonContentType) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export function buildWebSocketUrl(path: string): string {
  const parsedHttpUrl = new URL(BASE_URL);
  const wsProtocol = parsedHttpUrl.protocol === "https:" ? "wss:" : "ws:";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${wsProtocol}//${parsedHttpUrl.host}${normalizedPath}`;
}

export async function fetchUserCredentials(firebaseUser: {
  uid: string;
  email: string | null;
  getIdToken: () => Promise<string>;
}): Promise<AuthCredentials> {
  const token = await firebaseUser.getIdToken();
  const response = await fetch(`${BASE_URL}/users/me`, {
    headers: createAuthHeaders(token, false),
  });

  if (!response.ok) {
    const error = new Error("Database profile sync failed.");
    (error as Error & { isProfileSyncFailure?: boolean }).isProfileSyncFailure = true;
    throw error;
  }

  const dbUser = await response.json();
  return {
    user: {
      uid: firebaseUser.uid,
      email: firebaseUser.email ?? "",
      name: dbUser.name,
    },
    token,
    role: dbUser.role,
  };
}

export async function fetchingData({
  endpoint,
  signal,
  headers,
  progressCallBackFn,
}: FetchDataOptions): Promise<any> {
  const fetchOptions: { headers?: Record<string, string>; signal?: AbortSignal } = {
    headers: headers,
  };

  if (signal) {
    fetchOptions.signal = signal;
  }

  const response = await fetch(`${BASE_URL}/${endpoint}`, fetchOptions);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(
      errorData.detail || "An error occured while fetching the data...",
    );
    (error as any).status = response.status;
    throw error;
  } else if (progressCallBackFn) {
    const contentLength = response.headers.get("content-length");
    const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
    const reader = (response.body as ReadableStream).getReader();
    let loadedBytes = 0;
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      chunks.push(value);
      loadedBytes += value.length;

      if (totalBytes > 0) {
        const progress = Math.round((loadedBytes / totalBytes) * 100);
        if (progressCallBackFn) {
          progressCallBackFn(progress);
        }
      } else {
        if (progressCallBackFn) {
          progressCallBackFn(100);
        }
      }
    }

    const allChunks = new Uint8Array(loadedBytes);
    let position = 0;
    for (const chunk of chunks) {
      allChunks.set(chunk, position);
      position += chunk.length;
    }
    const jsonString = new TextDecoder("utf-8").decode(allChunks);
    return JSON.parse(jsonString);
  } else {
    const resData = await response.json();
    return resData;
  }
}

export async function sendingData({
  endpoint,
  signal,
  body,
  headers,
}: SendingDataOptions): Promise<unknown> {
  const response = await fetch(`${BASE_URL}/${endpoint}`, {
    method: "POST",
    signal: signal,
    body: JSON.stringify(body),
    headers: headers,
  });
  const resData = await response.json();

  if (!response.ok) {
    const error = new Error();
    (error as any).message =
      resData.detail || "An error occured while sending the data...";
    (error as any).status = `${response.status}: ${response.statusText}`;
    throw error;
  } else {
    return resData;
  }
}

export async function editingData({
  endpoint,
  signal,
  body,
  headers,
}: EditingDataOptions): Promise<unknown> {
  const response = await fetch(`${BASE_URL}/${endpoint}`, {
    method: "PUT",
    signal: signal,
    body: JSON.stringify(body),
    headers: headers,
  });
  const resData = await response.json();

  if (!response.ok) {
    const error = new Error("An error occured while editing the data...");
    (error as any).status = `${response.status}: ${response.statusText}`;
    throw error;
  } else {
    return resData;
  }
}

export async function deletingData({
  endpoint,
  signal,
  headers,
}: DeletingDataOptions): Promise<unknown> {
  const response = await fetch(`${BASE_URL}/${endpoint}`, {
    method: "DELETE",
    signal: signal,
    headers: headers,
  });
  const resData = await response.json();

  if (!response.ok) {
    const error = new Error("An error occured while deleting the data...");
    (error as any).status = response.status;
    throw error;
  } else {
    return resData;
  }
}

export function Unsubscribe(dispatch: any) {
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      dispatch(authSliceActions.logoutUser());
      return;
    }

    try {
      const credentials = await fetchUserCredentials(firebaseUser);
      dispatch(authSliceActions.setCredentials(credentials));
      return true;
    } catch (error) {
      if (!(error as Error & { isProfileSyncFailure?: boolean }).isProfileSyncFailure) {
        console.error("Authentication synchronization failed:", error);
      }
      dispatch(authSliceActions.logoutUser());
      return false;
    }
  });
}
