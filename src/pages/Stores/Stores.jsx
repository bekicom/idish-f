import React, { useState } from "react";
import {
  Table,
  Modal,
  Form,
  Input,
  Button,
  message,
  Space,
  Popconfirm,
  Row,
  Col,
  Select,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import {
  useAddWarehouseMutation,
  useGetWarehousesQuery,
  useUpdateWarehouseMutation,
  useDeleteWarehouseMutation,
  useAddStoreMutation,
  useGetStoresQuery,
  useUpdateStoreMutation,
  useDeleteStoreMutation,
} from "../../context/service/ombor.service";
import { useGetProductsByWarehouseQuery } from "../../context/service/product.service";
// import "./Ombor.css";

export default function Stores() {
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isProductsModalVisible, setIsProductsModalVisible] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [form] = Form.useForm();
  const [addWarehouse] = useAddStoreMutation();
  const [updateWarehouse] = useUpdateWarehouseMutation();
  const [deleteWarehouse] = useDeleteWarehouseMutation();
  const { data: omborlar = [], refetch } = useGetStoresQuery();
  const { data: warehouses = [] } = useGetWarehousesQuery();
  const [editingStore, setEditingStore] = useState(null);
  const [editStore] = useUpdateStoreMutation();
  const [deleteStore] = useDeleteStoreMutation();
  const { data: products = [] } = useGetProductsByWarehouseQuery(
    selectedWarehouse?._id,
    {
      skip: !selectedWarehouse,
    }
  );

  // Состояния для поиска
  const [searchName, setSearchName] = useState("");
  const [searchBarcode, setSearchBarcode] = useState("");

  const showAddModal = () => {
    setIsAddModalVisible(true);
  };

  const handleAddCancel = () => {
    setIsAddModalVisible(false);
  };

  const handleAddOk = () => {
    form
      .validateFields()
      .then(async (values) => {
        form.resetFields();
        try {
          if (!editingStore) {
            await addWarehouse(values).unwrap();
            message.success("Ombor muvaffaqiyatli qo'shildi");
          } else {
            await editStore({
              id: editingStore,
              data: values,
            }).unwrap();
            message.success("Ombor muvaffaqiyatli tahrirlandi");
          }
          refetch();
          setIsAddModalVisible(false);
          setEditingStore(null);
        } catch (error) {
          console.error("Error adding warehouse: ", error);
          message.error("Ombor qo'shishda xatolik yuz berdi");
        }
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  const handleEdit = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setIsEditModalVisible(true);
    form.setFieldsValue({
      name: warehouse.name,
      address: warehouse.address,
      login: warehouse.login,
      password: "",
    });
  };

  const handleEditCancel = () => {
    setIsEditModalVisible(false);
    setSelectedWarehouse(null);
  };

  const handleEditOk = () => {
    form
      .validateFields()
      .then(async (values) => {
        try {
          await updateWarehouse({
            id: selectedWarehouse._id,
            ...values,
          }).unwrap();
          refetch();
          setIsEditModalVisible(false);
          setSelectedWarehouse(null);
          message.success("Ombor muvaffaqiyatli tahrirlandi");
        } catch (error) {
          console.error("Error updating warehouse: ", error);
          message.error("Ombor tahrirlashda xatolik yuz berdi");
        }
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  const handleDelete = async (id) => {
    try {
      await deleteStore(id).unwrap();
      refetch();
      message.success("Do'kon muvaffaqiyatli o'chirildi");
    } catch (error) {
      console.error("Error deleting warehouse: ", error);
      message.error("Do'kon o'chirishda xatolik yuz berdi");
    }
  };

  const handleViewProducts = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setIsProductsModalVisible(true);
    setSearchName(""); // Сброс поиска при открытии
    setSearchBarcode("");
  };

  const handleProductsModalCancel = () => {
    setIsProductsModalVisible(false);
    setSelectedWarehouse(null);
    setSearchName(""); // Сброс поиска при закрытии
    setSearchBarcode("");
  };

  const columns = [
    {
      title: "Nomi",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Joylashuvi",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "Tel raqam",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Login",
      dataIndex: "login",
      key: "address",
    },
    {
      title: "Bog'langan ombor",
      dataIndex: ["warehouseId", "name"],
      key: "address",
    },
    {
      title: "Amallar",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingStore(record._id);
              form.setFieldsValue({
                store_name: record.name,
                store_address: record.address,
                store_login: record.login,
                store_password: "",
                warehouseId: record.warehouseId?._id,
              });
              setIsAddModalVisible(true);
            }}
          />
          <Popconfirm
            title="Siz shu ma'lumotni o'chirmoqchimisiz?"
            onConfirm={() => handleDelete(record._id)}
            okText="Ha"
            cancelText="Yo'q"
          >
            <Button type="primary" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const productColumns = [
    {
      title: "Mahsulot Nomi",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Soni",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Birlik",
      dataIndex: "unit",
      key: "unit",
    },
    {
      title: "Sotib Olish Narxi",
      dataIndex: "purchasePrice",
      key: "purchasePrice",
      render: (text, record) =>
        `${record.purchasePrice.value} ${record.currency}`,
    },
    {
      title: "Sotish Narxi",
      dataIndex: "sellingPrice",
      key: "sellingPrice",
      render: (text, record) =>
        `${record.sellingPrice.value?.toFixed(2)} ${record.currency}`,
    },
    {
      title: "Kategoriya",
      dataIndex: "category",
      key: "category",
    },
    {
      title: "Shtrix Kod",
      dataIndex: "barcode",
      key: "barcode",
    },
  ];

  // Фильтрация продуктов по названию и штрих-коду
  const filteredProducts = products.filter((product) => {
    const matchesName = product.name
      .toLowerCase()
      .includes(searchName.toLowerCase());
    const matchesBarcode = product.barcode
      ?.toLowerCase()
      .includes(searchBarcode.toLowerCase());
    return (
      (searchName ? matchesName : true) &&
      (searchBarcode ? matchesBarcode : true)
    );
  });

  return (
    <div style={{ overflowX: "auto" }}>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={showAddModal}
        style={{ marginBottom: 16 }}
      >
        Yangi do'kon Qo'shish
      </Button>
      <Table
        scroll={{ x: "max-content" }}
        columns={columns}
        dataSource={omborlar}
        rowKey="_id"
      />
      <Modal
        title={!editingStore ? "Yangi Do'kon Qo'shish" : "Do'konni Tahrirlash"}
        visible={isAddModalVisible}
        onOk={handleAddOk}
        onCancel={handleAddCancel}
      >
        <Form
          autoComplete="off"
          form={form}
          layout="vertical"
          name="ombor_form"
        >
          <Row gutter={16}>
            <Col span={editingStore ? 24 : 12}>
              <Form.Item
                name="store_name"
                label="dokon Nomi"
                rules={[
                  {
                    required: true,
                    message: "Iltimos, dokon nomini kiriting!",
                  },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="store_address"
                label="Joylashuvi"
                rules={[
                  { required: true, message: "Iltimos, joylashuvni kiriting!" },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="store_phone"
                label="Telefon Raqami"
                rules={[
                  { required: true, message: "Iltimos, tel raqamni kiriting!" },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="store_login"
                label="Login"
                rules={[
                  { required: true, message: "Iltimos, loginni kiriting!" },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="store_password"
                label="Parol"
                rules={[
                  { required: true, message: "Iltimos, parolni kiriting!" },
                ]}
              >
                <Input />
              </Form.Item>
              {editingStore && (
                <Form.Item
                  name="warehouseId"
                  label="Bog'langan ombor"
                  rules={[
                    {
                      required: true,
                      message: "Iltimos, bog'langan omborni tanlang",
                    },
                  ]}
                >
                  <Select>
                    {warehouses.map((warehouse) => (
                      <Select.Option key={warehouse.name} value={warehouse._id}>
                        {warehouse.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              )}
            </Col>
            {!editingStore && (
              <Col span={12}>
                <Form.Item
                  name="w_name"
                  label="Ombor Nomi"
                  rules={[
                    {
                      required: true,
                      message: "Iltimos, ombor nomini kiriting!",
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="w_address"
                  label="Joylashuvi"
                  rules={[
                    {
                      required: true,
                      message: "Iltimos, joylashuvni kiriting!",
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="w_login"
                  label="Login"
                  rules={[
                    { required: true, message: "Iltimos, loginni kiriting!" },
                  ]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="w_password"
                  label="Parol"
                  rules={[
                    { required: true, message: "Iltimos, parolni kiriting!" },
                  ]}
                >
                  <Input />
                </Form.Item>
              </Col>
            )}
          </Row>
        </Form>
      </Modal>
      <Modal
        title="Ombor Ma'lumotlarini Taxrirlash"
        visible={isEditModalVisible}
        onOk={handleEditOk}
        onCancel={handleEditCancel}
      >
        <Form
          form={form}
          layout="vertical"
          name="edit_ombor_form"
          initialValues={selectedWarehouse}
        >
          <Form.Item
            name="name"
            label="Ombor Nomi"
            rules={[
              { required: true, message: "Iltimos, ombor nomini kiriting!" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="address"
            label="Joylashuvi"
            rules={[
              { required: true, message: "Iltimos, joylashuvni kiriting!" },
            ]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Ombordagi Mahsulotlar"
        visible={isProductsModalVisible}
        onCancel={handleProductsModalCancel}
        footer={null}
        width="80%"
      >
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="Mahsulot nomini kiriting"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            style={{ width: 200 }}
          />
          <Input
            placeholder="Shtrix kodni kiriting"
            value={searchBarcode}
            onChange={(e) => setSearchBarcode(e.target.value)}
            style={{ width: 200 }}
          />
        </Space>
        <Table
          columns={productColumns}
          dataSource={filteredProducts}
          rowKey="_id"
        />
      </Modal>
    </div>
  );
}
