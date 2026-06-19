import "./App.css";
import AdminDashboard from "./components/Pages/Admin Dashboard/AdminDashboard";
import Login from "./components/Pages/Authentication/Login";
import Homepage from "./components/Pages/Homepage/Homepage";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ProtectedRoute from "./components/Pages/ProtectedRoute";
import { useEffect } from "react";

import { useDispatch } from "react-redux";

import { BASE_URL } from "./Constants";
import { serverStatusActions } from "./store/serverStatus";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient, Unsubscribe } from "./util/http";

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

  useEffect(() => {
    Unsubscribe(dispatch);
  }, [dispatch]);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;
