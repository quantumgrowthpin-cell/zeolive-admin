import apiClientV2 from "./apiClient";

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClientV2.post("/admin/uploads/image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data?.data;
};

export const uploadAudio = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClientV2.post("/admin/uploads/audio", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data?.data;
};
