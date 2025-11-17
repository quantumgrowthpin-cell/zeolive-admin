import apiClientV2 from "./apiClient";

export const fetchReactions = async () => {
  const response = await apiClientV2.get("/admin/reactions");

  return response.data?.data || [];
};

export const createReaction = async payload => {
  const response = await apiClientV2.post("/admin/reactions", payload);

  return response.data?.data;
};

export const updateReaction = async (reactionId, payload) => {
  const response = await apiClientV2.patch(`/admin/reactions/${reactionId}`, payload);

  return response.data?.data;
};

export const toggleReaction = async reactionId => {
  const response = await apiClientV2.post(`/admin/reactions/${reactionId}/toggle`);

  return response.data?.data;
};

export const deleteReaction = async reactionId => {
  const response = await apiClientV2.delete(`/admin/reactions/${reactionId}`);

  return response.data?.data;
};
