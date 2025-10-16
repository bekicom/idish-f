import { apiSlice } from "./api.service";

// `omborApi` xizmatini yaratamiz va endpointlarni qo'shamiz
export const omborApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    addWarehouse: builder.mutation({
      query: (warehouseData) => ({
        url: "/warehouses/add",
        method: "POST",
        body: warehouseData,
      }),
    }),
    getWarehouses: builder.query({
      query: () => ({
        url: "/warehouses",
        method: "GET",
      }),
    }),
    addStore: builder.mutation({
      query: (warehouseData) => ({
        url: "/stores/add",
        method: "POST",
        body: warehouseData,
      }),
    }),
    getStores: builder.query({
      query: () => ({
        url: "/stores",
        method: "GET",
      }),
    }),
    updateWarehouse: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/warehouses/${id}`,
        method: "PUT",
        body: data,
      }),
    }),
    deleteWarehouse: builder.mutation({
      query: (id) => ({
        url: `/warehouses/${id}`,
        method: "DELETE",
      }),
    }),
    updateStore: builder.mutation({
      query: ({ id, data }) => ({
        url: `/stores/${id}`,
        method: "PUT",
        body: data,
      }),
    }),
    deleteStore: builder.mutation({
      query: (id) => ({
        url: `/stores/${id}`,
        method: "DELETE",
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useAddWarehouseMutation,
  useGetWarehousesQuery,
  useUpdateWarehouseMutation,
  useDeleteWarehouseMutation,
  useAddStoreMutation,
  useGetStoresQuery,
  useUpdateStoreMutation,
  useDeleteStoreMutation,
} = omborApi;
