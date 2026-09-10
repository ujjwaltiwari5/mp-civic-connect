import api from "./api";

export const getAnalyticsOverview = () => api.get("/analytics/overview");
export const getAnalyticsByCategory = () => api.get("/analytics/by-category");
export const getAnalyticsByDepartment = () => api.get("/analytics/by-department");
export const getAnalyticsResolutionTime = () => api.get("/analytics/resolution-time");