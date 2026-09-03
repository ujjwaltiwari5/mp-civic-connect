import api from "./api";

export const createComplaint = (payload) => api.post("/complaints", payload);
export const getMyComplaints = () => api.get("/complaints/mine");