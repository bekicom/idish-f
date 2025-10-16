import React, { useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  InputNumber,
  Select,
  message,
  Tag,
  Input,
} from "antd";
import {
  useGetProductsPartnerQuery,
  usePayPartnerDebtMutation,
} from "../../context/service/partner.service";

const { Option } = Select;

const PartnerDebts = () => {
  // 🔌 API
  const { data: partners = [], isLoading } = useGetProductsPartnerQuery();
  const [payPartnerDebt] = usePayPartnerDebtMutation();

  // 🔽 UI state
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  // 🪙 To‘lov modalini ochish
  const handlePayClick = (partner) => {
    setSelectedPartner(partner);
    setIsModalVisible(true);
    form.resetFields();
  };

  // 💰 To‘lov yuborish
  const handlePaySubmit = async (values) => {
    try {
      await payPartnerDebt({
        partnerId: selectedPartner._id,
        amount: Number(values.amount),
        method: values.method,
        note: values.note || "",
      }).unwrap();

      message.success("💵 To‘lov muvaffaqiyatli amalga oshirildi!");
      setIsModalVisible(false);
      form.resetFields();
    } catch (err) {
      console.error("Pay error:", err);
      const backendMsg =
        err?.data?.error || err?.data?.message || "❌ To‘lov amalga oshmadi!";
      message.error(backendMsg);
    }
  };

  //  Jadval ustunlari
  const columns = [
    {
      title: "Hamkor nomi",
      dataIndex: "name_partner",
      key: "name_partner",
    },
    {
      title: "Raqam",
      dataIndex: "partner_number",
      key: "partner_number",
    },
    {
      title: "Manzil",
      dataIndex: "partner_address",
      key: "partner_address",
    },
    {
      title: "Valyuta",
      dataIndex: "currency",
      key: "currency",
      render: (text) => text || "-",
    },
    {
      title: "Jami qarz",
      dataIndex: "total_debt",
      key: "total_debt",
      render: (t) => (t ? t.toLocaleString() : "0"),
    },
    {
      title: "To‘langan",
      dataIndex: "paid_amount",
      key: "paid_amount",
      render: (t) => (t ? t.toLocaleString() : "0"),
    },
    {
      title: "Qolgan qarz",
      dataIndex: "remaining_debt",
      key: "remaining_debt",
      render: (t) => {
        const color = t <= 0 ? "green" : "volcano";
        return <Tag color={color}>{t ? t.toLocaleString() : "0"}</Tag>;
      },
    },
    {
      title: "Amallar",
      key: "actions",
      render: (_, record) => (
        <Button
          type="primary"
          disabled={record.remaining_debt <= 0}
          onClick={() => handlePayClick(record)}
        >
           To‘lov qilish
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 20 }}> Hamkor qarzlari</h2>

      <Table
        columns={columns}
        dataSource={partners}
        rowKey="_id"
        bordered
        size="middle"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        open={isModalVisible}
        title={` ${selectedPartner?.name_partner || ""} — To‘lov qilish`}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="To‘lovni amalga oshirish"
        cancelText="Bekor qilish"
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={handlePaySubmit}
          initialValues={{ method: "naqt" }}
        >
          <Form.Item
            name="amount"
            label=" To‘lov summasi"
            rules={[{ required: true, message: "Summani kiriting!" }]}
          >
            <InputNumber
              min={1}
              style={{ width: "100%" }}
              placeholder="Masalan: 500"
            />
          </Form.Item>

          <Form.Item
            name="method"
            label=" To‘lov turi"
            rules={[{ required: true, message: "To‘lov turini tanlang!" }]}
          >
            <Select placeholder="Tanlang">
              <Option value="naqt">Naqt</Option>
              <Option value="karta">Plastik</Option>
              <Option value="bank">Bank o‘tkazma</Option>
            </Select>
          </Form.Item>

          <Form.Item name="note" label=" Izoh ">
            <Input placeholder="Masalan: VIP mijoz yoki 10-oktyabr uchun to‘lov" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PartnerDebts;
