import apiClientV2 from "./apiClient";

export const fetchPaymentTransactions = async ({ status, provider } = {}) => {
  const response = await apiClientV2.get("/admin/payment-transactions", {
    params: { status, provider },
  });

  
return response.data?.data || [];
};
