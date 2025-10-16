import React, { useState, useEffect } from "react";
import {
  Tabs,
  Table,
  Button,
  InputNumber,
  Modal,
  Select,
  message,
  Popover,
} from "antd";
import {
  useCreateTransportionMutation,
  useGetSentTransportionsQuery,
  useAcceptTransportionMutation,
  useCencelTransportionMutation,
} from "../../context/service/transportion.service";
import { useGetProductsQuery } from "../../context/service/product.service";
import { useGetWarehousesQuery } from "../../context/service/ombor.service";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import "./transportion.css";
import socket from "../../socket";

const { TabPane } = Tabs;
const { Option } = Select;

const Transportion = () => {
  const { data: products = [] } = useGetProductsQuery();
  const { data: sentTransportions = [], refetch } =
    useGetSentTransportionsQuery();
  const [createTransportion] = useCreateTransportionMutation();
  const { data: warehouses = [] } = useGetWarehousesQuery();
  const role = localStorage.getItem("role");
  const [acceptTransportion] = useAcceptTransportionMutation();
  const [cencelTransportion] = useCencelTransportionMutation();
  const [basket, setBasket] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [toWarehouse, setToWarehouse] = useState(null);
  const id = localStorage.getItem("_id");
  const [fromWarehouse, setFromWarehouse] = useState(
    role === "admin" ? null : id
  );

  useEffect(() => {
    const handleNewTransportion = () => {
      refetch();
    };

    socket.on("newTransportion", handleNewTransportion);

    return () => {
      socket.off("newTransportion", handleNewTransportion);
    };
  }, []);

  const handleAddToBasket = (product) => {
    if (!basket.find((item) => item?._id === product?._id)) {
      setBasket([...basket, { ...product, quantity: 1, unit: "quantity" }]);
    } else {
      message.warning("Bu mahsulot allaqachon qo‘shilgan");
    }
  };

  const updateQuantity = (productId, value) => {
    setBasket((prev) =>
      prev.map((item) => {
        if (item?._id !== productId) return item;
        return {
          ...item,
          quantity: value,
        };
      })
    );
  };

  const handleCreateTransportion = async () => {
    for (let item of basket) {
      const product = products.find((p) => p?._id === item?._id);
      if (!product) {
        return message.error(`Mahsulot topilmadi: ${item.name}`);
      }

      let available = 0;
      if (item.unit === "quantity") {
        available = product.quantity;
      } else if (item.unit === "package_quantity") {
        available = product.package_quantity;
      } else if (item.unit === "box_quantity") {
        available = product.box_quantity;
      }

      if (item.quantity > available) {
        return message.error(
          `${
            item.name
          } mahsuloti uchun ombordagi miqdor yetarli emas (${item.quantity?.toFixed(
            2
          )} > ${available?.toFixed(2)})`
        );
      }
    }

    if (!toWarehouse) {
      return message.error("Ombor tanlanmagan");
    }

    if (basket.length === 0) {
      return message.error("Savatchada mahsulot yo‘q");
    }

    const payload = {
      from_warehouse: fromWarehouse,
      to_warehouse: toWarehouse,
      products: basket.map((item) => ({
        product_id: item?._id,
        quantity: item.quantity,
        unit: item.unit,
      })),
    };
    try {
      await createTransportion(payload).unwrap();
      message.success("Jo‘natma yaratildi");
      setBasket([]);
      setModalOpen(false);
    } catch (err) {
      message.error("Xatolik yuz berdi");
    }
  };

  const productColumns = [
    { title: "Nomi", dataIndex: "name" },
    { title: "Kategoriya", dataIndex: "category" },
    { title: "O'lcham", dataIndex: "size" },
    { title: "Kod", dataIndex: "code" },
    { title: "Dona soni", dataIndex: "quantity" },
    {
      title: "Pachka soni",
      dataIndex: "package_quantity",
      render: (text) => text?.toFixed(2),
    },
    {
      title: "Karobka soni",
      dataIndex: "box_quantity",
      render: (text) => text?.toFixed(2),
    },
    {
      title: "Umumiy vazni",
      dataIndex: "total_kg",
      render: (text) => text?.toFixed(2),
    },
    {
      title: "Amal",
      render: (_, record) => (
        <Button type="primary" onClick={() => handleAddToBasket(record)}>
          Qo‘shish
        </Button>
      ),
    },
  ];

  const updateUnit = (productId, value) => {
    setBasket((prev) =>
      prev.map((item) =>
        item?._id === productId ? { ...item, unit: value } : item
      )
    );
  };
  const basketColumns = [
    { title: "Nomi", dataIndex: "name" },
    { title: "Kategoriya", dataIndex: "category" },
    { title: "O'lcham", dataIndex: "size" },
    { title: "Kod", dataIndex: "code" },
    {
      title: "Miqdor",
      dataIndex: "quantity",
      render: (_, record) => {
        return (
          <InputNumber
            value={record.quantity}
            type="number"
            min={1}
            onChange={(val) => updateQuantity(record?._id, val)}
          />
        );
      },
    },
    {
      title: "Birlik",
      render: (_, item) => (
        <Select
          value={item.unit}
          onChange={(val) => updateUnit(item?._id, val)}
          style={{ width: "200px" }}
          defaultValue={"quantity"}
        >
          <Option value="quantity">Dona</Option>
          {item.isPackage && <Option value="package_quantity">Pachka</Option>}
          <Option value="box_quantity">Karobka</Option>
        </Select>
      ),
    },
  ];

  const stm = {
    kg_quantity: "kg",
    quantity: "dona",
    box_quantity: "karobka",
    package_quantity: "pachka",
  };

  const acceptData = async (id) => {
    try {
      await acceptTransportion(id).unwrap();
      message.success("Jo‘natma qabul qilindi");
    } catch (err) {
      message.error("Xatolik yuz berdi");
    }
  };
  const cencelData = async (id) => {
    try {
      await cencelTransportion(id).unwrap();
      message.success("Jo‘natma bekor qilindi");
    } catch (err) {
      message.error("Xatolik yuz berdi");
    }
  };
  const statusTexts = {
    quantity: "dona",
    box_quantity: "quti",
    package_quantity: "pachka",
  };
  const transportionColumns = [
    {
      title: "Jo‘natuvchi",
      dataIndex: "from_warehouse",
      render: (val) => val?.name || "-",
    },
    {
      title: "Qabul qiluvchi",
      dataIndex: "to_warehouse",
      render: (val) => val?.name || "-",
    },
    {
      title: "Holati",
      dataIndex: "status",
      render: (val) =>
        val === "in_process"
          ? "Jarayonda"
          : val === "delivered"
          ? "Yetkazib berildi"
          : val === "cancelled"
          ? "Bekor qilindi"
          : val,
    },
    {
      title: "Amal",
      render: (_, item) => (
        <div style={{ display: "flex", gap: "10px" }}>
          <Button
            onClick={() => acceptData(item?._id)}
            icon={<CheckOutlined />}
            type="primary"
          />
          <Button
            onClick={() => cencelData(item?._id)}
            icon={<CloseOutlined />}
            danger
          />
          <Popover
            placement="bottom"
            trigger="click"
            content={
              <Table
                dataSource={item.products}
                columns={[
                  {
                    title: "Tovar nomi",
                    render: (_, record) => record.product_id.name,
                  },
                  { title: "Miqdor", render: (_, record) => record.quantity },
                  {
                    title: "Birlik",
                    dataIndex: "unit",
                    render: (text) => stm[text] || text,
                  },
                ]}
              />
            }
          >
            <Button type="link">Mahsulotlar</Button>
          </Popover>
        </div>
      ),
    },
  ];

  return (
    <>
      <Tabs defaultActiveKey="1" style={{ overflowX: "auto" }}>
        <TabPane
          defaultActiveKey="1"
          style={{ overflowX: "auto" }}
          tab="Jo‘natma yaratish"
          key="1"
        >
          <div
            className="transportion"
            style={{ display: "flex", flexDirection: "column" }}
          >
            <h3>Qaysi ombordan</h3>
            <Select
              placeholder="Omborni tanlang"
              style={{ width: "20%" }}
              value={fromWarehouse}
              disabled={role === "warehouse"}
              onChange={(val) => setFromWarehouse(val)}
            >
              {warehouses.map((wh) => (
                <Option key={wh?._id} value={wh?._id}>
                  {wh.name}
                </Option>
              ))}
            </Select>
            <div
              style={{
                display: "flex",
                width: "100%",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                }}
              >
                <h3 className="mt-4">Savatcha</h3>
                <Table
                  rowKey="_id"
                  columns={basketColumns}
                  dataSource={basket}
                  pagination={false}
                />

                <Button
                  type="primary"
                  className="mt-3"
                  style={{ width: "200px", marginTop: "15px" }}
                  onClick={() => {
                    if (!fromWarehouse) {
                      return message.error("Ombor tanlanmagan");
                    }
                    setModalOpen(true);
                  }}
                  disabled={basket.length === 0}
                >
                  Jo'natma yaratish
                </Button>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                }}
              >
                <h3>Mavjud mahsulotlar</h3>
                <Table
                  rowKey="_id"
                  columns={productColumns}
                  dataSource={products.filter(
                    (p) => p.warehouse?._id === fromWarehouse
                  )}
                  pagination={false}
                />
              </div>
            </div>

            <Modal
              title="Qaysi omborga"
              open={modalOpen}
              onCancel={() => setModalOpen(false)}
              onOk={handleCreateTransportion}
            >
              <Select
                placeholder="Omborni tanlang"
                style={{ width: "100%" }}
                onChange={(val) => setToWarehouse(val)}
              >
                {warehouses
                  .filter((wh) => wh?._id !== fromWarehouse)
                  .map((wh) => (
                    <Option key={wh?._id} value={wh?._id}>
                      {wh.name}
                    </Option>
                  ))}
              </Select>
            </Modal>
          </div>
        </TabPane>
        {role === "admin" && (
          <TabPane tab="Yuborilganlar" key="2">
            <Table
              rowKey="_id"
              columns={transportionColumns}
              dataSource={sentTransportions}
            />
          </TabPane>
        )}
      </Tabs>
    </>
  );
};

export default Transportion;
