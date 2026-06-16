import { BASE_URL } from "@/Constants";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase_config";
import { authSliceActions } from "@/store/authSlice";
import { useSelector } from "react-redux";
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient();

export async function fetchingData({ endpoint, signal, headers }) {

  const fetchOptions = {
    headers: headers,
  };

  if (signal) {
    fetchOptions.signal = signal;
  }
  const response = await fetch(`${BASE_URL}/${endpoint}`, fetchOptions);
  const resData = await response.json();
  if (!response.ok) {
    const error = new Error("An error occured while fetching the data...");
    error.status = response.status;
    throw error;
  } else {
    return resData;
  }
}

export async function sendingData({ endpoint, signal, body, headers }) {
  const response = await fetch(`${BASE_URL}/${endpoint}`, {
    method: "POST",
    signal: signal,
    body: JSON.stringify(body),
    headers: headers,
  });
  const resData = await response.json();
  if (!response.ok) {
    const error = new Error();
    error.message =
      resData.detail || "An error occured while sending the data...";
    error.status = `${response.status}: ${response.statusText}`;
    throw error;
  } else {
    return resData;
  }
}

export async function editingData({ endpoint, signal, body, headers }) {
  const response = await fetch(`${BASE_URL}/${endpoint}`, {
    method: "PUT",
    signal: signal,
    body: JSON.stringify(body),
    headers: headers,
  });
  const resData = await response.json();
  if (!response.ok) {
    const error = new Error();
    error.message =
      resData.detail || "An error occured while sending the data...";
    error.status = `${response.status}: ${response.statusText}`;
    throw error;
  } else {
    return resData;
  }
}

export async function deletingData({ endpoint, signal, headers }) {
  const response = await fetch(`${BASE_URL}/${endpoint}`, {
    method: "DELETE",
    signal: signal,
    headers: headers,
  });
  const resData = await response.json();
  if (!response.ok) {
    const error = new Error("An error occured while deleting the data...");
    error.status = response.status;
    throw error;
  } else {
    return resData;
  }
}

export function Unsubscribe(dispatch) {
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
