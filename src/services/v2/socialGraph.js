import apiClientV2 from "./apiClient";

export const fetchFollowers = async ({ userId, page, limit } = {}) => {
  const response = await apiClientV2.get("/social/followers", {
    params: { userId, page, limit },
  });

  return response.data?.data || [];
};

export const fetchSocialSummary = async params => {
  const response = await apiClientV2.get("/admin/social/summary", { params });

  return response.data?.data || {};
};

export const exportFollowerCsv = async params => {
  const searchParams = new URLSearchParams(params).toString();
  const url = `/admin/social/export?${searchParams}`;
  const response = await apiClientV2.get(url, { responseType: "blob" });

  
return response.data;
};

export const exportCohortCsv = async params => {
  const searchParams = new URLSearchParams(params || {}).toString();
  const url = searchParams ? `/admin/social/cohorts/export?${searchParams}` : "/admin/social/cohorts/export";
  const response = await apiClientV2.get(url, { responseType: "blob" });

  
return response.data;
};

export const fetchFollowing = async ({ userId, page, limit } = {}) => {
  const response = await apiClientV2.get("/social/following", {
    params: { userId, page, limit },
  });

  return response.data?.data || [];
};
