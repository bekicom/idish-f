import { apiSlice } from "./api.service";

export const salaryApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ➕ Yangi oylik to‘lovi yaratish
    createSalaryPayment: builder.mutation({
      query: (paymentData) => ({
        url: "/salary-payments",
        method: "POST",
        body: paymentData,
      }),
      invalidatesTags: ["Salary"],
    }),

    getAllSalaryPayments: builder.query({
      query: () => ({
        url: "/salary-payments",
        method: "GET",
      }),
      providesTags: ["Salary"],
    }),

    // 👤 Bitta hodimning oylik to‘lovlari
    getSalaryPaymentsByEmployee: builder.query({
      query: (employeeId) => ({
        url: `/salary-payments/employee/${employeeId}`,
        method: "GET",
      }),
      providesTags: ["Salary"],
    }),

    // ❌ Oylik to‘lovini o‘chirish
    deleteSalaryPayment: builder.mutation({
      query: (paymentId) => ({
        url: `/salary-payments/${paymentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Salary"],
    }),
  }),
});

export const {
  useCreateSalaryPaymentMutation,
  useGetAllSalaryPaymentsQuery,
  useGetSalaryPaymentsByEmployeeQuery,
  useDeleteSalaryPaymentMutation,
} = salaryApi;
