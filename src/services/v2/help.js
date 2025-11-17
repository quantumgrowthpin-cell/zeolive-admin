import apiClientV2 from "./apiClient";

export const fetchTickets = async () => {
  const response = await apiClientV2.get("/help/tickets");

  
return response.data?.data || [];
};

export const updateTicketStatus = async ({ ticketId, status, adminNotes }) => {
  const response = await apiClientV2.post(`/help/tickets/${ticketId}/status`, { status, adminNotes });

  
return response.data?.data;
};

export const fetchFaq = async () => {
  const response = await apiClientV2.get("/help/faq");

  
return response.data?.data || [];
};

export const createFaq = async ({ question, answer }) => {
  const response = await apiClientV2.post("/help/faq", { question, answer });

  
return response.data?.data;
};
