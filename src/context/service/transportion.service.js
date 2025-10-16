import { apiSlice } from "./api.service";

export const transportionApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createTransportion: builder.mutation({
      query: (productData) => ({
        url: "/transportion/create",
        method: "POST",
        body: productData,
      }),
      invalidatesTags: ["Transportion", "Product"],
    }),
    getSentTransportions: builder.query({
      query: () => ({
        url: "/transportion/sent",
        method: "GET",
      }),
      providesTags: ["Transportion"],
    }),
    getGotTransportions: builder.query({
      query: () => ({
        url: "/transportion/got",
        method: "GET",
      }),
      providesTags: ["Transportion"],
    }),
    acceptTransportion: builder.mutation({
      query: (id) => ({
        url: `/transportion/accept/${id}`,
        method: "PUT",
        body: "",
      }),
      invalidatesTags: ["Transportion", "Product"],
    }),
    cencelTransportion: builder.mutation({
      query: (id) => ({
        url: `/transportion/reject/${id}`,
        method: "PUT",
        body: "",
      }),
      invalidatesTags: ["Transportion", "Product"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateTransportionMutation,
  useGetGotTransportionsQuery,
  useGetSentTransportionsQuery,
  useAcceptTransportionMutation,
  useCencelTransportionMutation,
} = transportionApi;
