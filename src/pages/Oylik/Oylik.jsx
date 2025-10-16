import React, { useState, useMemo } from "react";
import {
  Table,
  Input,
  Button,
  Modal,
  Form,
  InputNumber,
  message,
  Popconfirm,
  Space,
  Select,
} from "antd";
import { DollarCircleOutlined, DeleteOutlined } from "@ant-design/icons";
import { useGetEmployeesQuery } from "../../context/service/employee.service";
import {
  useCreateSalaryPaymentMutation,
  useDeleteSalaryPaymentMutation,
  useGetAllSalaryPaymentsQuery,
  useGetSalaryPaymentsByEmployeeQuery,
} from "../../context/service/salary.service";

const { Search } = Input;

export default function Oylik() {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [salaryModalVisible, setSalaryModalVisible] = useState(false);
  const [paymentHistoryModal, setPaymentHistoryModal] = useState(false);
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: employees = [], refetch: refetchEmployees } =
    useGetEmployeesQuery();
  const {
    data: allPayments = [],
    refetch: refetchPayments,
    isSuccess,
  } = useGetAllSalaryPaymentsQuery();
  const [createSalaryPayment] = useCreateSalaryPaymentMutation();
  const [deleteSalaryPayment] = useDeleteSalaryPaymentMutation();

  const { data: paymentHistory = [], refetch: refetchHistory } =
    useGetSalaryPaymentsByEmployeeQuery(selectedEmployee?._id, {
      skip: !selectedEmployee,
    });

  const handleGiveSalary = async () => {
    try {
      const values = await form.validateFields();
      await createSalaryPayment({
        ...values,
        employee: selectedEmployee._id,
      }).unwrap();
      message.success("✅ Oylik berildi");
      form.resetFields();
      setSalaryModalVisible(false);
      isSuccess && refetchPayments();
      refetchEmployees();
    } catch (err) {
      message.error("Xatolik yuz berdi");
    }
  };

  const handleDeletePayment = async (id) => {
    try {
      await deleteSalaryPayment(id).unwrap();
      message.success("To‘lov o‘chirildi");
      refetchPayments();
      refetchHistory();
    } catch (err) {
      message.error("Xatolik yuz berdi");
    }
  };

  const enrichedEmployees = useMemo(() => {
    return employees.map((emp) => {
      const empPayments = allPayments.filter((p) => {
        const paymentEmployeeId =
          typeof p.employee === "string" ? p.employee : p.employee?._id;

        return paymentEmployeeId === emp._id;
      });

      const totalPaid = empPayments.reduce((sum, p) => sum + p.amount, 0);
      const remaining = (emp.salary_amount || 0) - totalPaid;

      return {
        ...emp,
        totalPaid,
        remaining,
      };
    });
  }, [employees, allPayments]);

  const filteredEmployees = enrichedEmployees.filter((e) =>
    `${e.name} ${e.lastname}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const employeeColumns = [
    { title: "Ismi", dataIndex: "name" },
    { title: "Familyasi", dataIndex: "lastname" },
    { title: "Lavozimi", dataIndex: "position" },
    {
      title: "Oylik turi",
      dataIndex: "salary_type",
      render: (text) => (text === "oylik" ? "Oylik" : "Haftalik"),
    },
    {
      title: "Umumiy oylik",
      dataIndex: "salary_amount",
      render: (val, record) => `${val?.toLocaleString()} ` + record.currency,
    },
    {
      title: "Berilgan",
      dataIndex: "totalPaid",
      render: (val, record) => `${val?.toLocaleString()} ` + record.currency,
    },
    {
      title: "Qolgan",
      dataIndex: "remaining",
      render: (val, record) => (
        <span style={{ color: val > 0 ? "#faad14" : "#52c41a" }}>
          {val?.toLocaleString() + " " + record.currency}
        </span>
      ),
    },
    {
      title: "Amallar",
      render: (record) => (
        <Space>
          <Button
            type="primary"
            icon={<DollarCircleOutlined />}
            onClick={() => {
              setSelectedEmployee(record);
              setSalaryModalVisible(true);
            }}
          >
            Oylik berish
          </Button>
          <Button
            onClick={() => {
              setSelectedEmployee(record);
              setPaymentHistoryModal(true);
              refetchHistory();
            }}
          >
            To‘lovlar
          </Button>
        </Space>
      ),
    },
  ];

  const historyColumns = [
    {
      title: "Sana",
      dataIndex: "date",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    { title: "Miqdori", dataIndex: "amount" },
    { title: "Izoh", dataIndex: "description" },
    {
      title: "Amal",
      render: (record) => (
        <Popconfirm
          title="O‘chirilsinmi?"
          onConfirm={() => handleDeletePayment(record._id)}
        >
          <Button danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          overflowX: "auto",
        }}
      >
        <h2>Hodimlarga oylik berish</h2>
        <Search
          placeholder="Ism bo‘yicha qidirish"
          allowClear
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: 300 }}
        />
      </div>

      <Table
        columns={employeeColumns}
        dataSource={filteredEmployees}
        rowKey="_id"
        bordered
        pagination={{ pageSize: 8 }}
        scroll={{ x: "max-content" }}
      />

      <Modal
        title={`Oylik berish — ${selectedEmployee?.name} ${selectedEmployee?.lastname}`}
        open={salaryModalVisible}
        onCancel={() => setSalaryModalVisible(false)}
        onOk={handleGiveSalary}
        okText="Berish"
        cancelText="Bekor qilish"
      >
        <Form autoComplete="off" form={form} layout="vertical">
          <Form.Item
            name="amount"
            label="To‘lov miqdori"
            rules={[{ required: true, message: "Miqdor majburiy" }]}
          >
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              placeholder="Masalan: 2000000"
            />
          </Form.Item>
          {/* currency */}
          <Form.Item label="Valyuta" rules={[{ required: true }]}>
            <Select
              disabled={selectedEmployee?.currency}
              placeholder="Valyutani tanlang"
              value={selectedEmployee?.currency}
            >
              <Select.Option value="UZS">UZS</Select.Option>
              <Select.Option value="USD">USD</Select.Option>
              <Select.Option value="KGS">KGS</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="Izoh (ixtiyoriy)">
            <Input placeholder="Masalan: May oylik" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`To‘lovlar tarixi — ${selectedEmployee?.name} ${selectedEmployee?.lastname}`}
        open={paymentHistoryModal}
        onCancel={() => setPaymentHistoryModal(false)}
        footer={null}
        width={700}
      >
        <Table
          columns={historyColumns}
          dataSource={paymentHistory}
          rowKey="_id"
          pagination={false}
          bordered
        />
      </Modal>
    </div>
  );
}
