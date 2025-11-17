import apiClientV2 from "./apiClient";

export const listReferralSystems = async () => {
  const response = await apiClientV2.get("/admin/referral-systems");
  return response.data?.data || [];
};

export const createReferralSystem = async (payload) => {
  const response = await apiClientV2.post("/admin/referral-systems", payload);
  return response.data?.data;
};

export const updateReferralSystem = async (id, payload) => {
  const response = await apiClientV2.patch(`/admin/referral-systems/${id}`, payload);
  return response.data?.data;
};

export const toggleReferralSystem = async (id) => {
  const response = await apiClientV2.post(`/admin/referral-systems/${id}/toggle`);
  return response.data?.data;
};

export const deleteReferralSystem = async (id) => {
  await apiClientV2.delete(`/admin/referral-systems/${id}`);
  return true;
};
