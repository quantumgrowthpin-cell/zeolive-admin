import apiClientV2 from "./apiClient";

export const fetchGiftHistory = async params => {
  const response = await apiClientV2.get("/admin/gift-history", { params });

  return {
    data: response.data?.data || [],
    meta: response.data?.meta || {},
  };
};

export const fetchGiftStats = async params => {
  const response = await apiClientV2.get("/admin/gift-history/stats", { params });

  return response.data?.data || {};
};

export const exportGiftHistoryCsv = async params => {
  const search = new URLSearchParams(params).toString();
  const response = await apiClientV2.get(`/admin/gift-history/export?${search}`, { responseType: "blob" });

  
return response.data;
};
