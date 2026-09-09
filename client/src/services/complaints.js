import api from "./api";

export const createComplaint = (formData) =>
  api.post("/complaints", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const getMyComplaints = () => api.get("/complaints/mine");

export const getComplaintById = (id) => api.get(`/complaints/${id}`);
export const getAllComplaints = (params) => api.get("/complaints", { params });
export const assignDepartment = (id, department) =>
  api.patch(`/complaints/${id}/assign`, { department });
export const getAssignedComplaints = (params) => api.get("/complaints/assigned", { params });

export const updateComplaintStatus = (id, formData) =>
  api.patch(`/complaints/${id}/status`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  export const getDuplicateReviewQueue = () => api.get("/complaints/duplicates");
export const reviewDuplicate = (id, payload) =>
  api.patch(`/complaints/${id}/duplicate-review`, payload);