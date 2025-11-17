import apiClientV2 from "./apiClient";

export const fetchAgencies = async ({ status, country, page, limit } = {}) => {
  const response = await apiClientV2.get("/admin/agencies", {
    params: { status, country, page, limit },
  });

  return {
    data: response.data?.data || [],
    meta: response.data?.meta || {},
  };
};

export const updateAgencyStatus = async ({ agencyId, status }) => {
  const response = await apiClientV2.post(`/admin/agencies/${agencyId}/status`, { status });

  
return response.data?.data;
};

export const updateAgencyCommission = async ({ agencyId, commissionRate }) => {
  const response = await apiClientV2.patch(`/admin/agencies/${agencyId}/commission`, { commissionRate });

  
return response.data?.data;
};

export const createAgency = async (payload) => {
  const response = await apiClientV2.post("/agencies", payload);

  
return response.data?.data;
};

export const createBdTeamMember = async ({ userId, bdManagerId, agencyId, notes }) => {
  const response = await apiClientV2.post("/agencies/bd-team", { userId, bdManagerId, agencyId, notes });

  
return response.data?.data;
};

export const assignHostToAgency = async ({ userId, agencyId, bdManagerId, bdTeamMemberId }) => {
  const response = await apiClientV2.post("/agencies/assign-host", { userId, agencyId, bdManagerId, bdTeamMemberId });

  
return response.data?.data;
};
