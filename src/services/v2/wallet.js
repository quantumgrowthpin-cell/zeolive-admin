import apiClientV2 from "./apiClient";

export const fetchWalletHistory = async ({ page = 1, limit = 25 } = {}) => {
  const response = await apiClientV2.get("/wallet/history", {
    params: { page, limit },
  });

  
return response.data?.data || { items: [], meta: {} };
};

export const creditWallet = async ({ amount, balanceType }) => {
  const response = await apiClientV2.post("/wallet/mock-topup", { amount, balanceType });

  
return response.data?.data;
};
