import apiClientV2 from "./apiClient";

export const fetchAdminDashboard = async () => {
  const response = await apiClientV2.get("/analytics/admin");

  
return response.data?.data || {};
};

export const fetchBdmDashboard = async () => {
  const response = await apiClientV2.get("/analytics/bdm");

  
return response.data?.data || {};
};
