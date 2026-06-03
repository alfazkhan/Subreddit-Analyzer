import "./App.css";
import AdminDashboard from "./components/Pages/Admin Dashboard/AdminDashboard";
import Login from "./components/Pages/Authentication/Login";
import Homepage from "./components/Pages/Homepage/Homepage";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ProtectedRoute from "./components/Pages/ProtectedRoute";
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase_config";
import { useDispatch } from "react-redux";
import { authSliceActions } from "./store/authSlice";
import { BASE_URL } from "./Constants";
import { serverStatusActions } from "./store/serverStatus";

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
      const response = await fetch(BASE_URL + "/summary");
      const resData = await response.json();
      if (!response.ok) {
        dispatch(serverStatusActions.serverStatusChange("offline"));
        throw new Error(resData.message || "Server is Offline!");
      } else {
        dispatch(serverStatusActions.serverStatusChange("online"));
      }

      dispatch(serverStatusActions.updateCacheSummary(resData));
    }

    fetchPostData();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          // console.log("Token:", token);
          const response = await fetch(`${BASE_URL}/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log("Response:", response);

          if (response.ok) {
            const dbUser = await response.json();
            dispatch(
              authSliceActions.setCredentials({
                user: { uid: firebaseUser.uid, email: firebaseUser.email },
                token: token,
                role: dbUser.role,
              }),
            );
            console.log("dbUser:", dbUser);
          } else {
            console.log("Logging Out...");
            dispatch(authSliceActions.logoutUser());
          }
        } catch (error) {
          console.log(error);
          console.log("Logging Out...");
          dispatch(authSliceActions.logoutUser());
        }
      } else {
        console.log("Logging Out...");
        dispatch(authSliceActions.logoutUser());
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  return <RouterProvider router={router} />;
}

export default App;
