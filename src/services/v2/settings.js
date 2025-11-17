import apiClientV2 from "./apiClient";

export const fetchSettings = async () => {
  const response = await apiClientV2.get("/settings");

  
return response.data?.data || [];
};

export const updateSetting = async ({ key, value }) => {
  const response = await apiClientV2.post("/settings", { key, value });

  
return response.data?.data;
};
