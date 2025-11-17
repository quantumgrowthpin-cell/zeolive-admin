import apiClientV2 from "./apiClient";

export const fetchHosts = async params => {
  const response = await apiClientV2.get("/admin/hosts", { params });

  return {
    data: response.data?.data || [],
    meta: response.data?.meta || {},
  };
};

export const updateHostStatus = async (hostId, status) => {
  const response = await apiClientV2.patch(`/admin/hosts/${hostId}/status`, { status });

  return response.data?.data;
};

export const updateHostAssignment = async (hostId, payload) => {
  const response = await apiClientV2.patch(`/admin/hosts/${hostId}/assignment`, payload);

  return response.data?.data;
};
