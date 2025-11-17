import apiClientV2 from "./apiClient";

export const listCoinPlans = async () => {
  const response = await apiClientV2.get("/admin/coin-plans");

  
return response.data?.data || [];
};

export const createCoinPlan = async (payload) => {
  const response = await apiClientV2.post("/admin/coin-plans", payload);

  
return response.data?.data;
};

export const updateCoinPlan = async (planId, payload) => {
  const response = await apiClientV2.patch(`/admin/coin-plans/${planId}`, payload);

  
return response.data?.data;
};

export const toggleCoinPlan = async (planId, field = "isActive") => {
  const response = await apiClientV2.post(`/admin/coin-plans/${planId}/toggle`, {}, {
    params: { field },
  });

  
return response.data?.data;
};

export const deleteCoinPlan = async (planId) => {
  await apiClientV2.delete(`/admin/coin-plans/${planId}`);
  
return true;
};
