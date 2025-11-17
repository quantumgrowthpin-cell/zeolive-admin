import apiClientV2 from "./apiClient";

export const fetchStoreItems = async ({ type } = {}) => {
  const response = await apiClientV2.get("/admin/store-items", { params: { type } });

  
return response.data?.data || [];
};

export const createStoreItem = async (payload) => {
  const response = await apiClientV2.post("/admin/store-items", payload);

  
return response.data?.data;
};

export const updateStoreItem = async (itemId, payload) => {
  const response = await apiClientV2.patch(`/admin/store-items/${itemId}`, payload);

  
return response.data?.data;
};

export const toggleStoreItem = async (itemId) => {
  const response = await apiClientV2.post(`/admin/store-items/${itemId}/toggle`);

  
return response.data?.data;
};

export const deleteStoreItem = async (itemId) => {
  await apiClientV2.delete(`/admin/store-items/${itemId}`);
  
return true;
};
