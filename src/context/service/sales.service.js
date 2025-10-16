import { apiSlice } from "./api.service";

export const salesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    sellProduct: builder.mutation({
      query: (saleData) => ({
        url: "/sales/sell",
        method: "POST",
        body: saleData,
      }),
      invalidatesTags: ["Sale", "Product"],
    }),
    getSalesHistory: builder.query({
      query: () => ({
        url: "/sales/history",
        method: "GET",
      }),
      providesTags: ["Sale"],
    }),
    getClientHistory: builder.query({
      query: (clientId) => ({
        url: `/clients/${clientId}/history`,
        method: "GET",
      }),
    }),
    // 🔥 yangi qo‘shildi
    updateSale: builder.mutation({
      query: ({ id, body }) => ({
        url: `/sales/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Sale"], // yangilaganda sotuvlar qayta chaqiriladi
    }),
  }),
  overrideExisting: false,
});

export const {
  useSellProductMutation,
  useGetSalesHistoryQuery,
  useGetClientHistoryQuery,
  useUpdateSaleMutation, // 🔥 yangi qo‘shildi
} = salesApi;
