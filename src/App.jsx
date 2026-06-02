import "./App.css";
import AdminDashboard from "./components/Pages/Admin Dashboard/AdminDashboard";
import Homepage from "./components/Pages/Homepage/Homepage";
import {createBrowserRouter, RouterProvider} from "react-router-dom"


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


function App() {


  return <RouterProvider router={router}/>
}

export default App;
