import { BASE_URL } from "@/Constants";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase_config";
import { authSliceActions } from "@/store/authSlice";
import { QueryClient } from "@tanstack/react-query";
import type {
  DeletingDataOptions,
  EditingDataOptions,
  FetchDataOptions,
  SendingDataOptions,
} from "@/util/Types";

export const queryClient = new QueryClient();

export async function fetchingData({ 
  endpoint, 
  signal, 
  headers, 
  progressCallBackFn 
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
      errorData.detail || "An error occured while fetching the data..."
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
  headers 
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
  headers 
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
  headers 
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
      const token = await firebaseUser.getIdToken();

      const response = await fetch(`${BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const dbUser = await response.json();
        dispatch(
          authSliceActions.setCredentials({
            user: {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: dbUser.name,
            },
            token: token,
            role: dbUser.role,
          }),
        );
        return true;
      } else {
        dispatch(authSliceActions.logoutUser());
        return false;
      }
    } catch (error) {
      console.error("Authentication synchronization failed:", error);
      dispatch(authSliceActions.logoutUser());
    }
  });
}