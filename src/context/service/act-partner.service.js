import { apiSlice } from "./api.service";

export const actPartnerApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getActPartners: builder.query({
      query: () => "/actpartner",
      providesTags: ["ActPartner"],
    }),
    createActPartner: builder.mutation({
      query: (partner) => ({
        url: "/actpartner/add",
        method: "POST",
        body: partner,
      }),
      invalidatesTags: ["ActPartner"],
    }),
    updateActPartner: builder.mutation({
      query: ({ id, body }) => ({
        url: `/actpartner/${id}`,
        method: "PUT",
        body: body,
      }),
      invalidatesTags: ["ActPartner"],
    }),
    deleteActPartner: builder.mutation({
      query: (id) => ({
        url: `/actpartner`,
        method: "POST",
        body: id,
      }),
      invalidatesTags: ["ActPartner"],
    }),
  }),
});

export const {
  useGetActPartnersQuery,
  useCreateActPartnerMutation,
  useUpdateActPartnerMutation,
  useDeleteActPartnerMutation,
} = actPartnerApi;
