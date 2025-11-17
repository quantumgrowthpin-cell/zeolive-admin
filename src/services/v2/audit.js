import apiClientV2 from "./apiClient";

export const fetchAuditLogs = async ({ page = 1, limit = 50, action, resourceType } = {}) => {
  const response = await apiClientV2.get("/audit", {
    params: { page, limit, action, resourceType },
  });

  return {
    data: response.data?.data || [],
    meta: response.data?.meta || {},
  };
};
