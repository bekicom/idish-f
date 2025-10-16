// context/service/productPartnerService.js
import { apiSlice } from "./api.service";

export const productPartnerApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 🧩 Hamkor orqali tovar qo‘shish
    addProductPartner: builder.mutation({
      query: (productData) => ({
        url: "/partner/add",
        method: "POST",
        body: productData,
      }),
      invalidatesTags: ["ProductPartner"],
    }),

    // 📦 Barcha hamkor mahsulotlarini olish
    getProductsPartner: builder.query({
      query: () => ({
        url: "/partner",
        method: "GET",
      }),
      providesTags: ["ProductPartner"],
    }),

    // 🏭 Omborga qarab hamkor mahsulotlarini olish
    getProductsByWarehousePartner: builder.query({
      query: (warehouseId) => ({
        url: `/partner/warehouse/${warehouseId}`,
        method: "GET",
      }),
      providesTags: ["ProductPartner"],
    }),

    // ✏️ Hamkor productni yangilash
    updateProductPartner: builder.mutation({
      query: ({ id, data }) => ({
        url: `/partner/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["ProductPartner"],
    }),

    // ❌ Hamkor productni o‘chirish
    deleteProductPartner: builder.mutation({
      query: (id) => ({
        url: `/partner/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ProductPartner"],
    }),

    // 💵 Hamkorga qarz to‘lash
    payPartnerDebt: builder.mutation({
      query: (data) => ({
        url: "/partners/pay", // ✅ yangilangan endpoint
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["ProductPartner"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useAddProductPartnerMutation,
  useGetProductsPartnerQuery,
  useGetProductsByWarehousePartnerQuery,
  useUpdateProductPartnerMutation,
  useDeleteProductPartnerMutation,
  usePayPartnerDebtMutation, // 💵 eksport
} = productPartnerApi;
