import { apiSlice } from "./api.service";

export const debtApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 🔹 Qarz yaratish
    createDebt: builder.mutation({
      query: (debtData) => ({
        url: "/debts",
        method: "POST",
        body: debtData,
      }),
      invalidatesTags: ["Debt"],
    }),

    // 🔹 Mijoz bo‘yicha qarzlar
    getDebtsByClient: builder.query({
      query: (clientId) => ({
        url: `/debts/client/${clientId}`,
        method: "GET",
      }),
      providesTags: ["Debt"],
    }),

    // 🔹 Qarz to‘lash (storeId bilan)
    payDebt: builder.mutation({
      query: ({ id, amount, currency, type, storeId }) => ({
        url: `/debts/pay/${id}`,
        method: "PUT",
        body: { amount, currency, type, storeId }, // ✅ storeId yuboriladi
      }),
      invalidatesTags: ["Debt"],
    }),

    // 🔹 Barcha qarzdorlar
    getAllDebtors: builder.query({
      query: () => ({
        url: "/debts/debtors",
        method: "GET",
      }),
      providesTags: ["Debt"],
    }),

    // 🔹 Kunlik to‘lovlar (faqat paymentHistory)
    getDailyPaymentsByStoreId: builder.query({
      query: ({ date, storeId }) => ({
        url: `/daily/debt`,
        method: "GET",
        params: { date, storeId },
      }),
      providesTags: ["Debt"],
    }),

    // 🔹 ✅ Kunlik to‘liq hisobot (sotuv + qarz + to‘lov)
    getDailyReport: builder.query({
      query: ({ date, storeId }) => ({
        url: `/debts/daily/report`,
        method: "GET",
        params: { date, storeId },
      }),
      providesTags: ["Debt"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateDebtMutation,
  useGetDebtsByClientQuery,
  usePayDebtMutation,
  useGetAllDebtorsQuery,
  useLazyGetDailyPaymentsByStoreIdQuery,
  // ✅ yangi qo‘shimcha hook:
  useLazyGetDailyReportQuery,
} = debtApi;
