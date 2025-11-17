import apiClientV2 from "./apiClient";

export const fetchHostApplications = async ({ status } = {}) => {
  const response = await apiClientV2.get("/host-applications", {
    params: { status },
  });

  
return response.data?.data || [];
};

export const updateHostApplicationStatus = async ({ applicationId, status, notes }) => {
  const response = await apiClientV2.post(`/host-applications/${applicationId}/status`, {
    status,
    notes,
  });

  
return response.data?.data;
};
