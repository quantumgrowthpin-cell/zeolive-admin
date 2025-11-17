import apiClientV2 from "./apiClient";

export const fetchGiftCategories = async () => {
  const response = await apiClientV2.get("/admin/gift-categories");

  
return response.data?.data || [];
};

export const createGiftCategory = async payload => {
  const response = await apiClientV2.post("/admin/gift-categories", payload);

  
return response.data?.data;
};

export const updateGiftCategory = async (categoryId, payload) => {
  const response = await apiClientV2.patch(`/admin/gift-categories/${categoryId}`, payload);

  
return response.data?.data;
};

export const deleteGiftCategory = async categoryId => {
  const response = await apiClientV2.delete(`/admin/gift-categories/${categoryId}`);

  
return response.data?.data;
};
