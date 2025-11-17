import apiClientV2 from "./apiClient";

export const getCurrentProfile = async () => {
  const response = await apiClientV2.get("/users/me");
  return response.data?.data;
};

export const updateCurrentProfile = async (payload) => {
  const response = await apiClientV2.patch("/users/me", payload);
  return response.data?.data;
};
