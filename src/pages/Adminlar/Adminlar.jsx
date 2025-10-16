import React, { useState } from "react";
import { Button, Modal, Form, Input, message, Checkbox, Table } from "antd";
import {
  UserAddOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import {
  useSignUpAsAdminMutation,
  useGetUsersQuery,
  useDeleteAdminMutation,
  useUpdateAdminMutation,
} from "../../context/service/adminlar.service";
import "./adminlar.css";

const { confirm } = Modal;

export default function Adminlar() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [signUpAsAdmin] = useSignUpAsAdminMutation();
  const { data: admins, isLoading, refetch } = useGetUsersQuery();

  const [deleteAdmin] = useDeleteAdminMutation();
  const [updateAdmin] = useUpdateAdminMutation();
  const [form] = Form.useForm();

  const showModal = () => setIsModalVisible(true);

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleEditCancel = () => {
    setIsEditModalVisible(false);
    setEditingAdmin(null);
    form.resetFields();
  };

  const handleFinish = async (values) => {
    const { name, login, password, role } = values;

    // Устанавливаем значения по умолчанию для permissions, если success не передается
    const permissions = {
      home: false,
      daily: false,
      statistika: false,
      admin: false,
      ombor: false,
      stores: false,
      product: false,
      partner: false,
      client: false,
      debtors: false,
      promo: false,
      sales: false,
      brak: false,
      expense: false,
      report: false,
      "report-add": false,
      hodimlar: false,
      oylik: false,
      transportions: false,
    };

    const payload = { name, login, password, role, success: permissions };

    try {
      await signUpAsAdmin(payload).unwrap();
      message.success("Foydalanuvchi muvaffaqiyatli qo'shildi!");
      setIsModalVisible(false);
      form.resetFields();
      refetch();
    } catch (err) {
      message.error("Foydalanuvchini qo'shishda xatolik yuz berdi.");
    }
  };

  const handleEditFinish = async (values) => {
    const { name, login, password, role, success = [] } = values;

    const permissions = {
      home: success.includes("home"),
      daily: success.includes("daily"),
      statistika: success.includes("statistika"),
      admin: success.includes("admin"),
      ombor: success.includes("ombor"),
      stores: success.includes("stores"),
      product: success.includes("product"),
      partner: success.includes("partner"),
      client: success.includes("client"),
      debtors: success.includes("debtors"),
      promo: success.includes("promo"),
      sales: success.includes("sales"),
      brak: success.includes("brak"),
      expense: success.includes("expense"),
      report: success.includes("report"),
      "report-add": success.includes("report-add"),
      hodimlar: success.includes("hodimlar"),
      oylik: success.includes("oylik"),
      transportions: success.includes("transportions"),
      unfinished: success.includes("unfinished"), // ✅ agar qo‘shgan bo‘lsangiz
    };

    const payload = {
      id: editingAdmin._id,
      name,
      login,
      password,
      role,
      success: permissions,
    };

    try {
      await updateAdmin(payload).unwrap();
      message.success("Foydalanuvchi muvaffaqiyatli yangilandi!");
      setIsEditModalVisible(false);
      setEditingAdmin(null);
      form.resetFields();
      refetch();
    } catch (err) {
      message.error("Foydalanuvchini yangilashda xatolik yuz berdi.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAdmin(id).unwrap();
      message.success("Foydalanuvchi muvaffaqiyatli o'chirildi!");
      refetch();
    } catch (error) {
      message.error("Foydalanuvchini o'chirishda xatolik yuz berdi.");
    }
  };

  const showDeleteConfirm = (id) => {
    confirm({
      title: "Bu foydalanuvchini o'chirishni istaysizmi?",
      icon: <ExclamationCircleOutlined />,
      content: "Bu harakatni qaytarishning imkoni yo'q!",
      okText: "Ha",
      okType: "danger",
      cancelText: "Yo'q",
      onOk() {
        handleDelete(id);
      },
    });
  };

  const columns = [
    { title: "Ism", dataIndex: "name", key: "name" },
    { title: "Login", dataIndex: "login", key: "login" },
    { title: "Role", dataIndex: "role", key: "role" },

    {
      title: "Bosh sahifa",
      dataIndex: ["success", "home"],
      key: "home",
      render: (text) => (text ? "Ha" : "Yo'q"),
    },
    {
      title: "Kunlik hisobot",
      dataIndex: ["success", "daily"],
      key: "daily",
      render: (text) => (text ? "Ha" : "Yo'q"),
    },
    {
      title: "Statistika",
      dataIndex: ["success", "statistika"],
      key: "statistika",
      render: (text) => (text ? "Ha" : "Yo'q"),
    },
    {
      title: "Adminlar",
      dataIndex: ["success", "admin"],
      key: "admin",
      render: (text) => (text ? "Ha" : "Yo'q"),
    },
    {
      title: "Omborlar",
      dataIndex: ["success", "ombor"],
      key: "ombor",
      render: (text) => (text ? "Ha" : "Yo'q"),
    },
    {
      title: "Do‘konlar",
      dataIndex: ["success", "stores"],
      key: "stores",
      render: (text) => (text ? "Ha" : "Yo'q"),
    },
    {
      title: "Mahsulotlar",
      dataIndex: ["success", "product"],
      key: "product",
      render: (text) => (text ? "Ha" : "Yo'q"),
    },
    {
      title: "Yetkazib beruvchilar",
      dataIndex: ["success", "partner"],
      key: "partner",
      render: (text) => (text ? "Ha" : "Yo'q"),
    },
    {
      title: "Mijozlar",
      dataIndex: ["success", "client"],
      key: "client",
      render: (text) => (text ? "Ha" : "Yo'q"),
    },
    {
      title: "Qarzdorlar",
      dataIndex: ["success", "debtors"],
      key: "debtors",
      render: (text) => (text ? "Ha" : "Yo'q"),
    },
    {
      title: "Promokodlar",
      dataIndex: ["success", "promo"],
      key: "promo",
      render: (text) => (text ? "Ha" : "Yo'q"),
    },
    {
      title: "Sotuvlar tarixi",
      dataIndex: ["success", "sales"],
      key: "sales",
      render: (text) => (text ? "Ha" : "Yo'q"),
    },
    {
      title: "Brak mahsulotlar",
      dataIndex: ["success", "brak"],
      key: "brak",
      render: (text) => (text ? "Ha" : "Yo'q"),
    },
    {
      title: "Xarajatlar",
      dataIndex: ["success", "expense"],
      key: "expense",
      render: (text) => (text ? "Ha" : "Yo'q"),
    },
    {
      title: "Dalolatnoma",
      dataIndex: ["success", "report"],
      key: "report",
      render: (text) => (text ? "Ha" : "Yo'q"),
    },
    {
      title: "Qoldiq qo‘shish",
      dataIndex: ["success", "report-add"],
      key: "report-add",
      render: (text) => (text ? "Ha" : "Yo'q"),
    },
    {
      title: "Hodimlar",
      dataIndex: ["success", "hodimlar"],
      key: "hodimlar",
      render: (text) => (text ? "Ha" : "Yo'q"),
    },
    {
      title: "Oylik hisobot",
      dataIndex: ["success", "oylik"],
      key: "oylik",
      render: (text) => (text ? "Ha" : "Yo'q"),
    },
    {
      title: "Tovar jo‘natma",
      dataIndex: ["success", "transportions"],
      key: "transportions",
      render: (text) => (text ? "Ha" : "Yo'q"),
    },
    {
      title: "Amallar",
      key: "actions",
      render: (_, record) => (
        <div className="admin__actions__card">
          <Button
            type="primary"
            onClick={() => {
              setEditingAdmin(record);
              setIsEditModalVisible(true);
              form.setFieldsValue({
                name: record.name,
                login: record.login,
                password: "",
                role: record.role,
                success: Object.keys(record.success).filter(
                  (key) => record.success[key]
                ),
              });
            }}
          >
            <EditOutlined />
          </Button>
          <Button
            type="primary"
            danger
            onClick={() => showDeleteConfirm(record._id)}
            icon={<DeleteOutlined />}
          />
        </div>
      ),
    },
  ];

  return (
    <div style={{ overflowX: "auto" }}>
      <Button
        type="primary"
        icon={<UserAddOutlined />}
        onClick={showModal}
        style={{ marginBottom: "10px" }}
      >
        Foydalanuvchi qo'shish
      </Button>

      <Modal
        title="Foydalanuvchi Qo'shish"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        style={{ marginTop: "50px" }}
      >
        <Form
          autoComplete="off"
          layout="vertical"
          initialValues={{ role: "admin" }}
          onFinish={handleFinish}
          form={form}
        >
          <Form.Item
            label="Ism"
            name="name"
            rules={[{ required: true, message: "Ismni kiriting!" }]}
          >
            <Input placeholder="Ism" />
          </Form.Item>
          <Form.Item
            label="Login"
            name="login"
            rules={[{ required: true, message: "Loginni kiriting!" }]}
          >
            <Input placeholder="Login" />
          </Form.Item>
          <Form.Item
            label="Parol"
            name="password"
            rules={[{ required: true, message: "Parolni kiriting!" }]}
          >
            <Input.Password placeholder="Parol" />
          </Form.Item>
          <Form.Item
            label="Role"
            name="role"
            rules={[{ required: true, message: "Roleni kiriting!" }]}
          >
            <Input disabled placeholder="Role" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Saqlash
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Foydalanuvchini Tahrirlash"
        open={isEditModalVisible}
        onCancel={handleEditCancel}
        footer={null}
        style={{ marginTop: "50MORpx" }}
      >
        <Form
          autoComplete="off"
          layout="vertical"
          onFinish={handleEditFinish}
          form={form}
        >
          <Form.Item
            label="Ism"
            name="name"
            rules={[{ required: true, message: "Ismni kiriting!" }]}
          >
            <Input placeholder="Ism" />
          </Form.Item>
          <Form.Item
            label="Login"
            name="login"
            rules={[{ required: true, message: "Loginni kiriting!" }]}
          >
            <Input placeholder="Login" />
          </Form.Item>
          <Form.Item
            label="Parol"
            name="password"
            rules={[{ required: true, message: "Parolni kiriting!" }]}
          >
            <Input.Password placeholder="Parol" />
          </Form.Item>
          <Form.Item
            label="Role"
            name="role"
            rules={[{ required: true, message: "Roleni kiriting!" }]}
          >
            <Input placeholder="Role" />
          </Form.Item>
          <Form.Item label="Ruxsatlar" name="success">
            <Checkbox.Group>
              <Checkbox value="home">Bosh sahifa</Checkbox>
              <Checkbox value="daily">Kunlik hisobot</Checkbox>
              <Checkbox value="statistika">Statistika</Checkbox>
              <Checkbox value="admin">Adminlar</Checkbox>
              <Checkbox value="ombor">Omborlar</Checkbox>
              <Checkbox value="stores">Do‘konlar</Checkbox>
              <Checkbox value="product">Mahsulotlar</Checkbox>
              <Checkbox value="partner">Yetkazib beruvchilar</Checkbox>
              <Checkbox value="client">Xaridorlar</Checkbox>
              <Checkbox value="debtors">Qarzdorlar</Checkbox>
              <Checkbox value="promo">Promokodlar</Checkbox>
              <Checkbox value="sales">Sotilgan mahsulotlar</Checkbox>
              <Checkbox value="brak">Brak mahsulotlar</Checkbox>
              <Checkbox value="expense">Xarajatlar</Checkbox>
              <Checkbox value="report">Dalolatnoma</Checkbox>
              <Checkbox value="report-add">Qoldiq qo‘shish</Checkbox>
              <Checkbox value="hodimlar">Hodimlar</Checkbox>
              <Checkbox value="oylik">Oylik hisobot</Checkbox>
              <Checkbox value="transportions">Tovar jo‘natma</Checkbox>
            </Checkbox.Group>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Saqlash
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Table
        dataSource={admins}
        columns={columns}
        loading={isLoading}
        rowKey="_id"
        pagination={{ pageSize: 10 }}
        scroll={{ x: "max-content" }}
      />
    </div>
  );
}
