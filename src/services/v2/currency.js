import apiClientV2 from './apiClient';

export const fetchCurrencies = async () => {
  const response = await apiClientV2.get('/admin/currency');

  return response.data?.data || [];
};

export const createCurrency = async payload => {
  const response = await apiClientV2.post('/admin/currency', payload);

  return response.data?.data || null;
};

export const updateCurrency = async (currencyId, payload) => {
  const response = await apiClientV2.patch(`/admin/currency/${currencyId}`, payload);

  return response.data?.data || null;
};

export const deleteCurrency = async currencyId => {
  const response = await apiClientV2.delete(`/admin/currency/${currencyId}`);

  return response.data?.data || null;
};

export const setDefaultCurrency = async currencyId => {
  const response = await apiClientV2.post(`/admin/currency/${currencyId}/default`);

  return response.data?.data || null;
};
