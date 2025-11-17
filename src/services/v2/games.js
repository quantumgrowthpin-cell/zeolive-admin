import apiClientV2 from "./apiClient";

export const fetchGameConfigs = async (params = {}) => {
  const response = await apiClientV2.get("/admin/games", { params });
  return response.data?.data || [];
};

export const createGameConfig = async (payload) => {
  const response = await apiClientV2.post("/admin/games", payload);
  return response.data?.data;
};

export const updateGameConfig = async (gameId, payload) => {
  const response = await apiClientV2.put(`/admin/games/${gameId}`, payload);
  return response.data?.data;
};

export const toggleGameConfig = async (gameId, isActive) => {
  const response = await apiClientV2.patch(`/admin/games/${gameId}/toggle`, typeof isActive === "boolean" ? { isActive } : {});
  return response.data?.data;
};

export const deleteGameConfig = async (gameId) => {
  const response = await apiClientV2.delete(`/admin/games/${gameId}`);
  return response.data?.success;
};
