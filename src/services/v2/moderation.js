import apiClientV2 from "./apiClient";

export const fetchReports = async ({ status } = {}) => {
  const response = await apiClientV2.get("/moderation/reports", { params: { status } });

  
return response.data?.data || [];
};

export const updateReportStatus = async ({ reportId, status }) => {
  const response = await apiClientV2.post(`/moderation/reports/${reportId}/status`, { status });

  
return response.data?.data;
};

export const updateUserStatus = async ({ userId, status }) => {
  const response = await apiClientV2.post(`/moderation/users/${userId}/status`, { status });

  
return response.data?.data;
};
