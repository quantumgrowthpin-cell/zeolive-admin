import apiClientV2 from "./apiClient";

export const fetchVideoFeed = async ({ page = 1, limit = 20 } = {}) => {
  const response = await apiClientV2.get("/videos/feed/public", {
    params: { page, limit },
  });
  return response.data?.data || [];
};

export const listVideos = async ({ status, search, limit = 30, page = 1 } = {}) => {
  const response = await apiClientV2.get("/admin/videos", {
    params: {
      status,
      search,
      limit,
      page,
    },
  });

  return {
    data: response.data?.data || [],
    meta: response.data?.meta || {},
  };
};

export const createVideo = async payload => {
  const response = await apiClientV2.post("/videos", payload);
  return response.data?.data;
};

export const updateVideo = async (videoId, payload) => {
  const response = await apiClientV2.patch(`/videos/${videoId}`, payload);
  return response.data?.data;
};
