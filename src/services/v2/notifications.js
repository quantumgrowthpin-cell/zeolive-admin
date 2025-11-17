import apiClientV2 from "./apiClient";

export const broadcastNotification = async ({ roleName, title, body, data }) => {
  const response = await apiClientV2.post("/notifications/broadcast", {
    roleName,
    title,
    body,
    data,
  });

  
return response.data?.data;
};
