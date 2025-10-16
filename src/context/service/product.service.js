// context/service/product.service.js
import { apiSlice } from "./api.service";

export const productApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    addProduct: builder.mutation({
      query: (productData) => ({
        url: "/products/add",
        method: "POST",
        body: productData,
      }),
      invalidatesTags: ["Product"],
    }),
    getProducts: builder.query({
      query: () => ({
        url: "/products",
        method: "GET",
      }),
      providesTags: ["Product"],
    }),
    getProductsByWarehouse: builder.query({
      query: (warehouseId) => ({
        url: `/products/warehouse/${warehouseId}`,
        method: "GET",
      }),
      providesTags: ["Product"],
    }),
    updateProduct: builder.mutation({
      query: ({ id, data }) => ({
        url: `/products/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Product"],
    }),
    setDiscountForProduct: builder.mutation({
      query: (body) => ({
        url: `/product/discount/set`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Product"],
    }),
    removeDiscountForProduct: builder.mutation({
      query: (body) => ({
        url: `/product/discount/remove`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Product"],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/products/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Product"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useAddProductMutation,
  useGetProductsQuery,
  useGetProductsByWarehouseQuery,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useRemoveDiscountForProductMutation,
  useSetDiscountForProductMutation,
} = productApi;
