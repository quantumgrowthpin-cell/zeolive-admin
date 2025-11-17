import apiClientV2 from "./apiClient";

export const fetchReferralCodes = async () => {
  const response = await apiClientV2.get("/referral/code");

  
return response.data?.data;
};

export const fetchReferralHistory = async () => {
  const response = await apiClientV2.get("/referral/history");

  
return response.data?.data || [];
};

export const applyReferralCode = async (code) => {
  const response = await apiClientV2.post("/referral/code", { code });

  
return response.data?.data;
};
