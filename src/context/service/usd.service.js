import { apiSlice } from "./api.service"; // API xizmatini import qilish

// Backend API URL
export const usdRateApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // USD kursini olish uchun GET so'rovi
    getUsdRate: builder.query({
      query: () => "/usd", // Backend endpoint
    }),
    // USD kursini yangilash uchun POST so'rovi
    updateUsdRate: builder.mutation({
      query: (body) => ({
        url: "/usd", // Backend endpoint
        method: "POST",
        body: body,
      }),
    }),
  }),
});

export const { useGetUsdRateQuery, useUpdateUsdRateMutation } = usdRateApi; // hook'larni eksport qilish
