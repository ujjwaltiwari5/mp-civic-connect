import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Departments from "./pages/admin/Departments";
import Categories from "./pages/admin/Categories";
import DepartmentComplaints from "./pages/department/DepartmentComplaints";
import UpdateComplaint from "./pages/department/UpdateComplaint";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminComplaints from "./pages/admin/AdminComplaints";
import NewComplaint from "./pages/NewComplaint";
import MyComplaints from "./pages/MyComplaints";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import ComplaintDetail from "./pages/ComplaintDetail";
import DuplicateReview from "./pages/admin/DuplicateReview";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/departments"
          element={
            <ProtectedRoute roles={["admin"]}>
              <Departments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <ProtectedRoute roles={["admin"]}>
              <Categories />
            </ProtectedRoute>
          }
        />
        <Route
  path="/admin"
  element={
    <ProtectedRoute roles={["admin"]}>
      <AdminDashboard />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/complaints"
  element={
    <ProtectedRoute roles={["admin"]}>
      <AdminComplaints />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/duplicates"
  element={
    <ProtectedRoute roles={["admin"]}>
      <DuplicateReview />
    </ProtectedRoute>
  }
/>
   <Route
    path="/complaints/new"
    element={
      <ProtectedRoute>
      <NewComplaint />
      </ProtectedRoute>
        }
   />
        <Route
          path="/complaints/mine"
          element={
            <ProtectedRoute>
              <MyComplaints />
            </ProtectedRoute>
          }
        />
         <Route
          path="/complaints/:id"
          element={
            <ProtectedRoute>
              <ComplaintDetail />
            </ProtectedRoute>
          }
        />
        <Route
         path="/department/complaints"
         element={
         <ProtectedRoute roles={["department_user"]}>
         <DepartmentComplaints />
         </ProtectedRoute>
        }
       />
        <Route
          path="/department/complaints/:id/update"
          element={
          <ProtectedRoute roles={["department_user"]}>
          <UpdateComplaint />
         </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;