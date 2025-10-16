import React, { useState } from "react";
import {
  Button,
  Table,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  message,
  Popconfirm,
} from "antd";
import {
  useCreateEmployeeMutation,
  useGetEmployeesQuery,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
} from "../../context/service/employee.service";

const { Option } = Select;

export default function Hodimlar() {
  const [form] = Form.useForm();
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const { data: employees = [], refetch, isLoading } = useGetEmployeesQuery();
  const [createEmployee] = useCreateEmployeeMutation();
  const [updateEmployee] = useUpdateEmployeeMutation();
  const [deleteEmployee] = useDeleteEmployeeMutation();

  const showModal = (record) => {
    if (record) {
      setEditingEmployee(record);
      form.setFieldsValue(record);
    } else {
      setEditingEmployee(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingEmployee) {
        await updateEmployee({ ...values, id: editingEmployee._id }).unwrap();
        message.success("Hodim yangilandi");
      } else {
        await createEmployee(values).unwrap();
        message.success("Hodim yaratildi");
      }
      refetch();
      setIsModalVisible(false);
    } catch (err) {
      message.error("Xatolik yuz berdi");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteEmployee(id).unwrap();
      message.success("Hodim o‘chirildi");
      refetch();
    } catch (err) {
      message.error("O‘chirishda xatolik");
    }
  };

  const columns = [
    {
      title: "Ismi",
      dataIndex: "name",
    },
    {
      title: "Familyasi",
      dataIndex: "lastname",
    },
    {
      title: "Lavozimi",
      dataIndex: "position",
    },
    {
      title: "Oylik",
      dataIndex: "salary_amount",
    },
    {
      title: "Oylik turi",
      dataIndex: "salary_type",
      render: (text) =>
        text === "oylik" ? "Oylik oladigan" : "Haftalik oladigan",
    },
    {
      title:"Valyuta",
      dataIndex: "currency",
    },
    {
      title: "Amallar",
      render: (record) => (
        <Space>
          <Button type="link" onClick={() => showModal(record)}>
            Tahrirlash
          </Button>
          <Popconfirm
            title="Rostdan ham o‘chirmoqchimisiz?"
            onConfirm={() => handleDelete(record._id)}
          >
            <Button type="link" danger>
              O‘chirish
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Button type="primary" onClick={() => showModal(null)}>
          + Yangi hodim
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={employees}
        rowKey="_id"
        loading={isLoading}
        bordered
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingEmployee ? "Hodimni tahrirlash" : "Yangi hodim"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={handleSubmit}
        okText="Saqlash"
        cancelText="Bekor qilish"
      >
        <Form autoComplete="off" layout="vertical" form={form}>
          <Form.Item
            name="name"
            label="Ismi"
            rules={[{ required: true, message: "Ism majburiy" }]}
          >
            <Input placeholder="Ism kiriting" />
          </Form.Item>

          <Form.Item
            name="lastname"
            label="Familyasi"
            rules={[{ required: true, message: "Familya majburiy" }]}
          >
            <Input placeholder="Familya kiriting" />
          </Form.Item>

          <Form.Item
            name="position"
            label="Lavozimi"
            rules={[{ required: true, message: "Lavozim majburiy" }]}
          >
            <Input placeholder="Lavozim kiriting" />
          </Form.Item>

          <Form.Item
            name="salary_amount"
            label="Oylik summasi"
            rules={[{ required: true, message: "Oylik majburiy" }]}
          >
            <InputNumber
              placeholder="Masalan: 2500000"
              style={{ width: "100%" }}
              min={0}
            />
          </Form.Item>

          {/* currency  */}
          <Form.Item
            name="currency"
            label="Valyuta"
            rules={[{ required: true, message: "Valyuta majburiy" }]}
          >
            <Select placeholder="Valyuta tanlang">
              <Option value="UZS">UZS</Option>
              <Option value="USD">USD</Option>
              <Option value="KGS">KGS</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="salary_type"
            label="Oylik turi"
            rules={[{ required: true, message: "Oylik turi majburiy" }]}
          >
            <Select placeholder="Oylik turini tanlang">
              <Option value="oylik">Oylik oladigan</Option>
              <Option value="haftalik">Haftalik oladigan</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
