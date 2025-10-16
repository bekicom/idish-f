import { apiSlice } from "./api.service";

export const employeeApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 🟢 Hodim yaratish
    createEmployee: builder.mutation({
      query: (employeeData) => ({
        url: "/employees",
        method: "POST",
        body: employeeData,
      }),
      invalidatesTags: ["Employee"],
    }),

    // 🔵 Barcha hodimlarni olish
    getEmployees: builder.query({
      query: () => ({
        url: "/employees",
        method: "GET",
      }),
      providesTags: ["Employee"],
    }),

    // 🟡 Bitta hodimni olish
    getEmployeeById: builder.query({
      query: (id) => ({
        url: `/employees/${id}`,
        method: "GET",
      }),
      providesTags: ["Employee"],
    }),

    // 🟠 Hodimni yangilash
    updateEmployee: builder.mutation({
      query: (employeeData) => ({
        url: `/employees/${employeeData.id}`,
        method: "PUT",
        body: employeeData,
      }),
      invalidatesTags: ["Employee"],
    }),

    // 🔴 Hodimni o‘chirish
    deleteEmployee: builder.mutation({
      query: (id) => ({
        url: `/employees/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Employee"],
    }),
  }),
});

export const {
  useCreateEmployeeMutation,
  useGetEmployeesQuery,
  useGetEmployeeByIdQuery,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
} = employeeApi;
