import api from "./api";

export const getDistricts = () => api.get("/districts");
export const getTehsilsByDistrict = (districtId) => api.get(`/districts/${districtId}/tehsils`);
export const getTehsilBoundary = (tehsilId) => api.get(`/tehsils/${tehsilId}/boundary`);