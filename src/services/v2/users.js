import apiClientV2 from "./apiClient";

export const fetchUsers = async (params = {}) => {
  const response = await apiClientV2.get("/users", { params });

  
return response.data?.data || { items: [], meta: {} };
};

export const fetchUserDetails = async (userId) => {
  if (!userId) throw new Error("userId is required");
  const response = await apiClientV2.get(`/users/${userId}/insights`);

  
return response.data?.data;
};

export const updateUserStatus = async ({ userId, status }) => {
  if (!userId) throw new Error("userId is required");
  const response = await apiClientV2.post(`/moderation/users/${userId}/status`, { status });

  
return response.data?.data;
};

export const fetchUserRoles = async (userId) => {
  const response = await apiClientV2.get(`/roles/${userId}`);

  
return response.data?.data || [];
};

export const assignRole = async (userId, payload) => {
  const response = await apiClientV2.post(`/roles/${userId}`, payload);

  
return response.data?.data;
};

export const revokeRole = async (userId, roleId) => {
  const response = await apiClientV2.post(`/roles/${userId}/${roleId}/revoke`);

  
return response.data?.data;
};
