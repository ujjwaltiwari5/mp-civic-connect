import api from "./api";

export const createComplaint = (formData) =>
  api.post("/complaints", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const getMyComplaints = () => api.get("/complaints/mine");

export const getComplaintById = (id) => api.get(`/complaints/${id}`);