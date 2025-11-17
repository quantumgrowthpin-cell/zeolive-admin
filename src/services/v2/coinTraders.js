import apiClientV2 from "./apiClient";

export const listCoinTraders = async (params = {}) => {
  const response = await apiClientV2.get("/admin/coin-traders", { params });

  
return response.data || { data: [], meta: {} };
};

export const registerCoinTrader = async (payload) => {
  const response = await apiClientV2.post("/admin/coin-traders", payload);

  
return response.data?.data;
};

export const updateTraderStatus = async (traderId, isActive) => {
  const response = await apiClientV2.patch(`/admin/coin-traders/${traderId}/status`, { isActive });

  
return response.data?.data;
};

export const adjustTraderBalance = async ({ traderId, amount, type, note }) => {
  const response = await apiClientV2.patch(`/admin/coin-traders/${traderId}/balance`, { amount, type, note });

  
return response.data?.data;
};

export const updateTraderProfile = async ({ traderId, countryCode, mobileNumber }) => {
  const response = await apiClientV2.patch(`/admin/coin-traders/${traderId}/profile`, { countryCode, mobileNumber });

  
return response.data?.data;
};

export const fetchTraderHistory = async (traderId, params = {}) => {
  const response = await apiClientV2.get(`/admin/coin-traders/${traderId}/history`, { params });

  
return response.data || { data: [], meta: {} };
};
