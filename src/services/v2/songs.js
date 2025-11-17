import apiClientV2 from "./apiClient";

export const fetchSongCategories = async () => {
  const response = await apiClientV2.get("/admin/media/categories");

  
return response.data?.data || [];
};

export const createSongCategory = async (payload) => {
  const response = await apiClientV2.post("/admin/media/categories", payload);

  
return response.data?.data;
};

export const updateSongCategory = async (categoryId, payload) => {
  const response = await apiClientV2.patch(`/admin/media/categories/${categoryId}`, payload);

  
return response.data?.data;
};

export const deleteSongCategory = async (categoryId) => {
  await apiClientV2.delete(`/admin/media/categories/${categoryId}`);
  
return true;
};

export const fetchSongs = async ({ categoryId, status } = {}) => {
  const response = await apiClientV2.get("/admin/media/songs", {
    params: {
      categoryId,
      status,
    },
  });

  
return response.data?.data || [];
};

export const createSong = async (payload) => {
  const response = await apiClientV2.post("/admin/media/songs", payload);

  
return response.data?.data;
};

export const updateSong = async (songId, payload) => {
  const response = await apiClientV2.patch(`/admin/media/songs/${songId}`, payload);

  
return response.data?.data;
};

export const deleteSongs = async (songId) => {
  await apiClientV2.delete(`/admin/media/songs/${songId}`);
  
return true;
};
