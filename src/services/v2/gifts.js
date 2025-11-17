import apiClientV2 from "./apiClient";

export const fetchGifts = async params => {
  const response = await apiClientV2.get("/admin/gifts", { params });

  
return response.data?.data || [];
};

export const createGift = async payload => {
  const response = await apiClientV2.post("/admin/gifts", payload);

  
return response.data?.data;
};

export const updateGift = async (giftId, payload) => {
  const response = await apiClientV2.patch(`/admin/gifts/${giftId}`, payload);

  
return response.data?.data;
};

export const deleteGift = async giftId => {
  const response = await apiClientV2.delete(`/admin/gifts/${giftId}`);

  
return response.data?.data;
};
