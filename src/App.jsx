import "./App.css";
import AdminDashboard from "./components/Pages/Admin Dashboard/AdminDashboard";
import Login from "./components/Pages/Authentication/Login";
import Homepage from "./components/Pages/Homepage/Homepage";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ProtectedRoute from "./components/Pages/ProtectedRoute";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useDispatch } from "react-redux";
import { authSliceActions } from "./store/authSlice";
import { BASE_URL } from "./Constants";
import { serverStatusActions } from "./store/serverStatus";
import { auth } from "../firebase_config";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Homepage />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["Super Admin", "Admin"]}>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
]);

function App() {
  const dispatch = useDispatch();
  // const [isAuthResolving, setIsAuthResolving] = useState(true);

  // 1. Fetch public API endpoints (Summary)
  useEffect(() => {
    async function fetchPostData() {
      try {
        const response = await fetch(`${BASE_URL}/summary`);
        const resData = await response.json();
        
        if (!response.ok) {
          dispatch(serverStatusActions.serverStatusChange("offline"));
          throw new Error(resData.message || "Server is Offline!");
        }

        dispatch(serverStatusActions.serverStatusChange("online"));
        dispatch(serverStatusActions.updateCacheSummary(resData));
      } catch (error) {
        console.error("Failed to fetch public summary data:", error);
      }
    }

    fetchPostData();
  }, [dispatch]);

  // 2. Manage Global Authentication Status & Session Persistence
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        dispatch(authSliceActions.logoutUser());
        // setIsAuthResolving(false);
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
              },
              token: token,
              role: dbUser.role,
            })
          );
        } else {
          dispatch(authSliceActions.logoutUser());
        }
      } catch (error) {
        console.error("Authentication synchronization failed:", error);
        dispatch(authSliceActions.logoutUser());
      } 
    });

    // Safely unsubscribe from the auth listener when the component unmounts
    return () => unsubscribe();
  }, [dispatch]);


  return <RouterProvider router={router} />;
}

export default App;