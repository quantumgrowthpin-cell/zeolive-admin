import apiClientV2 from "./apiClient";

export const listBanners = async (params = {}) => {
  const response = await apiClientV2.get("/admin/banners", { params });
  return response.data?.data || [];
};

export const createBanner = async formData => {
  const response = await apiClientV2.post("/admin/banners", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data?.data;
};

export const updateBanner = async (bannerId, formData) => {
  const response = await apiClientV2.patch(`/admin/banners/${bannerId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data?.data;
};

export const toggleBanner = async bannerId => {
  const response = await apiClientV2.post(`/admin/banners/${bannerId}/toggle`);
  return response.data?.data;
};

export const deleteBanner = async bannerId => {
  await apiClientV2.delete(`/admin/banners/${bannerId}`);
  return true;
};
