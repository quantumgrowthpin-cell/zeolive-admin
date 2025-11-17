import apiClientV2 from "./apiClient";

export const fetchVisitorSummaries = async params => {
  const response = await apiClientV2.get("/admin/profile-visitors", { params });

  return {
    data: response.data?.data || [],
    meta: response.data?.meta || {},
  };
};

export const fetchVisitorsForProfile = async ({ userId, limit }) => {
  const response = await apiClientV2.get(`/admin/profile-visitors/${userId}/visitors`, { params: { limit } });

  return response.data?.data || [];
};

export const fetchVisitedProfiles = async ({ userId, limit }) => {
  const response = await apiClientV2.get(`/admin/profile-visitors/${userId}/visited`, { params: { limit } });

  return response.data?.data || [];
};

export const exportVisitorSummaries = async params => {
  const search = new URLSearchParams(params).toString();
  const response = await apiClientV2.get(`/admin/profile-visitors/summaries/export?${search}`, { responseType: "blob" });

  
return response.data;
};
