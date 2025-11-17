import apiClientV2 from "./apiClient";

export const fetchPayoutRequests = async ({ status, page = 1, limit = 25, format } = {}) => {
  const response = await apiClientV2.get("/admin/payout-requests", {
    params: {
      status,
      page,
      limit,
      format,
    },
    responseType: format === "csv" ? "blob" : "json",
  });

  if (format === "csv") {
    return response.data;
  }

  return response.data?.data || [];
};

export const updatePayoutStatus = async ({ requestId, status, notes }) => {
  const response = await apiClientV2.post(`/admin/payout-requests/${requestId}/status`, {
    status,
    notes,
  });

  
return response.data?.data;
};
