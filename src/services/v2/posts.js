import apiClientV2 from "./apiClient";

export const fetchPublicFeed = async ({ page = 1, limit = 20 } = {}) => {
  const response = await apiClientV2.get("/posts/feed/public", {
    params: { page, limit },
  });
  return response.data?.data || [];
};

export const fetchFollowingFeed = async ({ page = 1, limit = 20 } = {}) => {
  const response = await apiClientV2.get("/posts/feed/following", {
    params: { page, limit },
  });
  return response.data?.data || [];
};

export const createPost = async payload => {
  const response = await apiClientV2.post("/posts", payload);
  return response.data?.data;
};

export const updatePost = async (postId, payload) => {
  const response = await apiClientV2.patch(`/posts/${postId}`, payload);
  return response.data?.data;
};
