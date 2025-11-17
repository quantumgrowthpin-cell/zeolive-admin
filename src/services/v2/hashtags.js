import apiClientV2 from "./apiClient";

export const fetchHashtags = async ({ includeInactive = true } = {}) => {
  const response = await apiClientV2.get("/admin/hashtags", {
    params: { includeInactive },
  });

  
return response.data?.data || [];
};

export const createHashtag = async (payload) => {
  const response = await apiClientV2.post("/admin/hashtags", payload);

  
return response.data?.data;
};

export const updateHashtag = async (hashTagId, payload) => {
  const response = await apiClientV2.patch(`/admin/hashtags/${hashTagId}`, payload);

  
return response.data?.data;
};

export const deleteHashtag = async (hashTagId) => {
  await apiClientV2.delete(`/admin/hashtags/${hashTagId}`);
  
return true;
};
