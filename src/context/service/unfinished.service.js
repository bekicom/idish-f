import { apiSlice } from "./api.service";

// router.post("/unfinished/add", auth, UnfinishedController.createUnfinished);
// router.get("/unfinished", auth, UnfinishedController.getUnfinished);
// router.put("/unfinished/:id", auth, UnfinishedController.updateUnfinished);
// router.delete("/unfinished/:id", auth, UnfinishedController.deleteUnfinished);
export const unfinishedApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    addUnfinished: builder.mutation({
      query: (unfinishedData) => ({
        url: "/unfinished/add",
        method: "POST",
        body: unfinishedData,
      }),
      invalidatesTags: ["Unfinished"],
    }),
    getUnfinished: builder.query({
      query: () => ({
        url: "/unfinished",
        method: "GET",
      }),
      providesTags: ["Unfinished"],
    }),
    updateUnfinished: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/unfinished/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Unfinished"],
    }),
    deleteUnfinished: builder.mutation({
      query: (id) => ({
        url: `/unfinished/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Unfinished"],
    }),
  }),
});

export const {
  useAddUnfinishedMutation,
  useGetUnfinishedQuery,
  useUpdateUnfinishedMutation,
  useDeleteUnfinishedMutation,
} = unfinishedApi;
