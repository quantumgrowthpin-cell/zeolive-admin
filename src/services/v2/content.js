import apiClientV2 from "./apiClient";

export const listPosts = async (params = {}) => {
  const response = await apiClientV2.get("/admin/content/posts", { params });

  
return response.data?.data || [];
};

export const updatePostStatus = async ({ postId, status }) => {
  const response = await apiClientV2.post(`/admin/content/posts/${postId}/status`, { status });

  
return response.data?.data;
};

export const listComments = async (params = {}) => {
  const response = await apiClientV2.get("/admin/content/comments", { params });

  
return response.data?.data || [];
};

export const updateCommentStatus = async ({ commentId, status }) => {
  const response = await apiClientV2.post(`/admin/content/comments/${commentId}/status`, { status });

  
return response.data?.data;
};
