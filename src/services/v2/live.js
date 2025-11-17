import apiClientV2 from "./apiClient";

export const fetchLiveStats = async ({ startDate, endDate } = {}) => {
  const response = await apiClientV2.get("/admin/live-stats", {
    params: { startDate, endDate },
  });

  
return response.data?.data || [];
};
