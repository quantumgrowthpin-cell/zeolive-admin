import apiClientV2 from "./apiClient";

export const listSubAdminInvites = async () => {
  const response = await apiClientV2.get("/admin/sub-admins/invites");

  
return response.data?.data || [];
};

export const createSubAdminInvite = async (payload) => {
  const response = await apiClientV2.post("/admin/sub-admins/invites", payload);

  
return response.data?.data;
};

export const cancelSubAdminInvite = async (inviteId) => {
  const response = await apiClientV2.post(`/admin/sub-admins/invites/${inviteId}/cancel`);

  
return response.data?.data;
};

export const listSubAdminAssignments = async () => {
  const response = await apiClientV2.get("/admin/sub-admins/assignments");

  
return response.data?.data || [];
};
