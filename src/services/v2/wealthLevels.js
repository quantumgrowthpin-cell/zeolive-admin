import apiClientV2 from "./apiClient";

export const listWealthLevels = async () => {
  const response = await apiClientV2.get("/admin/wealth-levels");

  
return response.data?.data || [];
};

export const createWealthLevel = async (payload) => {
  const response = await apiClientV2.post("/admin/wealth-levels", payload);

  
return response.data?.data;
};

export const updateWealthLevel = async (levelId, payload) => {
  const response = await apiClientV2.patch(`/admin/wealth-levels/${levelId}`, payload);

  
return response.data?.data;
};

export const updateWealthLevelPermissions = async (levelId, permissions) => {
  const response = await apiClientV2.patch(`/admin/wealth-levels/${levelId}/permissions`, permissions);

  
return response.data?.data;
};

export const deleteWealthLevel = async (levelId) => {
  await apiClientV2.delete(`/admin/wealth-levels/${levelId}`);
  
return true;
};
