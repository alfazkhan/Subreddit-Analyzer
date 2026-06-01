import "./App.css";
import AdminDashboard from "./components/Pages/Admin Dashboard/AdminDashboard";
import Homepage from "./components/Pages/Homepage";
import {createBrowserRouter, RouterProvider} from "react-router-dom"
import { useDispatch } from "react-redux";
import { serverStatusActions } from "./store/serverStatus";
import { useEffect } from "react";

const router = createBrowserRouter([
  {
    path: '/',
    element: <Homepage/>
  },
  {
    path: '/dashboard',
    element: <AdminDashboard/>
  }
]);

const BASE_URL = import.meta.env.PROD
  ? "https://api.theonlyalfaz.com"
  : "http://192.168.0.246:8000";

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
  }, []);

  return <RouterProvider router={router}/>
}

export default App;
