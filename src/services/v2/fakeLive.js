import apiClientV2 from "./apiClient";

export const fetchFakeStreams = async ({ streamType } = {}) => {
  const response = await apiClientV2.get("/admin/fake-live", {
    params: { streamType },
  });

  
return response.data?.data || [];
};

export const createFakeStream = async (payload) => {
  const response = await apiClientV2.post("/admin/fake-live", payload);

  
return response.data?.data;
};

export const updateFakeStream = async (streamId, payload) => {
  const response = await apiClientV2.patch(`/admin/fake-live/${streamId}`, payload);

  
return response.data?.data;
};

export const toggleFakeStream = async (streamId, isStreaming) => {
  const response = await apiClientV2.patch(`/admin/fake-live/${streamId}`, { isStreaming });

  
return response.data?.data;
};

export const deleteFakeStream = async (streamId) => {
  await apiClientV2.delete(`/admin/fake-live/${streamId}`);
  
return true;
};
