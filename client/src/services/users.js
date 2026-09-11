import api from "./api";

export const getUsers = (params) => api.get("/users", { params });

export const updateUserRole = (id, payload) => api.patch(`/users/${id}/role`, payload);