import React, { useMemo, useState } from "react";
import {
  Table,
  Button,
  message,
  Modal,
  Input,
  Select,
  Popover,
  Tag,
} from "antd";
import {
  useGetAllDebtorsQuery,
  usePayDebtMutation,
} from "../../context/service/debt.service";
import {
  usePayPartnerDebtMutation,
  useGetProductsPartnerQuery,
} from "../../context/service/partner.service";
import { EyeOutlined, DollarOutlined } from "@ant-design/icons";
import moment from "moment";
import { useNavigate } from "react-router-dom";

const Debtors = () => {
  // 🔌 API hooks
  const { data: debtors = [] } = useGetAllDebtorsQuery();
  const { data: partnerProduct = [] } = useGetProductsPartnerQuery();
  const [payDebt] = usePayDebtMutation();
  const [payPartnerDebt] = usePayPartnerDebtMutation();

  const role = localStorage.getItem("role");
  const navigate = useNavigate();

  // 🔽 UI state
  const [selectedDebtor, setSelectedDebtor] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [paymentType, setPaymentType] = useState("");
  const [searchText, setSearchText] = useState("");

  // 📊 Guruhlash
  const groupedData = useMemo(() => {
    const map = new Map();

    debtors.forEach((debtor) => {
      const clientName = debtor.clientId?.name || null;
      const partnerName =
        partnerProduct.find((p) => p.partner_number === debtor.partnerId)
          ?.name_partner || null;

      if (!clientName && !partnerName) return;

      const groupKey = clientName || partnerName;

      if (!map.has(groupKey)) {
        map.set(groupKey, {
          key: groupKey,
          qarzdor: groupKey,
          totalAmount: 0,
          remainingAmount: 0,
          children: [],
        });
      }

      const group = map.get(groupKey);
      group.totalAmount += debtor.totalAmount || 0;
      group.remainingAmount += debtor.remainingAmount || 0;
      group.children.push(debtor);
    });

    return Array.from(map.values());
  }, [debtors, partnerProduct]);

  // 🔍 Qidirish
  const filteredData = useMemo(() => {
    return groupedData.filter((item) =>
      item.qarzdor.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [groupedData, searchText]);

  // 💵 Qarz to‘lash
  const handlePayDebt = async () => {
    if (!selectedDebtor || !paymentAmount || !selectedCurrency || !paymentType)
      return message.warning("Barcha maydonlarni to‘ldiring!");

    try {
      if (selectedDebtor.clientId) {
        // 🔹 Mijoz qarzi
        await payDebt({
          id: selectedDebtor._id.split("_")[0],
          amount: Number(paymentAmount),
          currency: selectedCurrency,
          type: paymentType,
          storeId: localStorage.getItem("_id"),
        }).unwrap();
      } else if (selectedDebtor.partnerId) {
        // 🔹 Hamkor qarzi
        await payPartnerDebt({
          partnerId: selectedDebtor.partnerId?._id || selectedDebtor.partnerId,
          amount: Number(paymentAmount),
          currency: selectedCurrency,
          payment_method: paymentType,
          storeId: localStorage.getItem("_id"),
        }).unwrap();
      }

      message.success("💵 Qarz muvaffaqiyatli to‘landi!");
      setIsModalVisible(false);
      setSelectedDebtor(null);
      setPaymentAmount("");
      setSelectedCurrency("USD");
      setPaymentType("");
    } catch (error) {
      console.error(error);
      message.error("❌ To‘lovda xatolik yuz berdi!");
    }
  };

  // 📋 Asosiy ustunlar
  const generalColumns = [
    { title: "Qarzdor", dataIndex: "qarzdor" },
    {
      title: "Umumiy summa",
      dataIndex: "totalAmount",
      render: (v) => (typeof v === "number" ? v.toFixed(2) : "0.00"),
    },
    {
      title: "Qoldiq",
      dataIndex: "remainingAmount",
      render: (v) => (typeof v === "number" ? v.toFixed(2) : "0.00"),
    },
  ];

  // 📋 Detallar
  const debtColumns = [
    {
      title: "Qarzdor",
      render: (_, record) =>
        record.clientId?.name ||
        partnerProduct.find((p) => p.partner_number === record.partnerId)
          ?.name_partner,
    },
    {
      title: "Sana",
      dataIndex: "createdAt",
      render: (date) => moment(date).format("DD.MM.YYYY"),
    },
    {
      title: "Umumiy summa",
      dataIndex: "totalAmount",
      render: (val) => `${val?.toFixed(2)} USD`,
    },
    {
      title: "Qoldiq",
      dataIndex: "remainingAmount",
      render: (val) => `${val?.toFixed(2)} USD`,
    },
    {
      title: "Holat",
      dataIndex: "status",
      render: (status) =>
        status === "paid" ? (
          <Tag color="green">To‘langan</Tag>
        ) : (
          <Tag color="red">To‘lanmagan</Tag>
        ),
    },
    {
      title: "Tarix",
      render: (_, record) => (
        <Popover
          title="To‘lovlar tarixi"
          content={
            <div>
              {(record.paymentHistory || []).map((h, i) => (
                <div key={i}>
                  {moment(h.date).format("DD.MM.YYYY")} - {h.amount.toFixed(2)}{" "}
                  {h.currency}
                </div>
              ))}
            </div>
          }
          trigger="click"
        >
          <Button size="small" icon={<EyeOutlined />} />
        </Popover>
      ),
    },
    {
      title: "Amal",
      render: (_, record) =>
        (role === "store" || role === "admin") && record.status !== "paid" ? (
          <Button
            icon={<DollarOutlined />}
            onClick={() => {
              setSelectedDebtor(record);
              setIsModalVisible(true);
            }}
          >
            To‘lash
          </Button>
        ) : null,
    },
  ];

  const productCols = [
    { title: "Tovar nomi", dataIndex: ["productId", "name"] },
    { title: "Soni", dataIndex: "quantity" },
    {
      title: "Narx",
      dataIndex: "sellingPrice",
      render: (v) => `${v.toFixed(2)}`,
    },
    {
      title: "Jami",
      dataIndex: "totalAmount",
      render: (v) => `${v.toFixed(2)}`,
    },
    { title: "Valyuta", dataIndex: "currency" },
    { title: "Birlik", render: () => "Dona" },
  ];

  return (
    <div className="page">
      {/* 🔝 Header */}
      <div className="page_header" style={{ display: "flex", gap: 12 }}>
        <h2>Qarzdorlar</h2>
        <Input
          placeholder="Qarzdor ismi bo‘yicha qidirish..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 250 }}
        />
        {role !== "admin" && (
          <Button onClick={() => navigate("/")} type="primary">
            Orqaga
          </Button>
        )}
      </div>

      {/* 📊 Jadval */}
      <Table
        rowKey="key"
        dataSource={filteredData}
        columns={generalColumns}
        expandable={{
          expandedRowRender: (group) => (
            <Table
              rowKey="_id"
              columns={debtColumns}
              dataSource={group.children}
              pagination={false}
              expandable={{
                expandedRowRender: (record) => (
                  <Table
                    columns={productCols}
                    dataSource={record.products || [record]}
                    pagination={false}
                    rowKey={(r) => r.productId._id}
                  />
                ),
              }}
            />
          ),
        }}
      />

      {/* 💵 To‘lov modali */}
      <Modal
        title="Qarz to‘lash"
        open={isModalVisible}
        onOk={handlePayDebt}
        onCancel={() => setIsModalVisible(false)}
      >
        <Input
          type="number"
          placeholder="To‘lov miqdori"
          value={paymentAmount}
          onChange={(e) => setPaymentAmount(e.target.value)}
        />

        <Select
          value={selectedCurrency}
          onChange={setSelectedCurrency}
          placeholder="Valyuta"
          style={{ width: "100%", marginTop: 12 }}
        >
          <Select.Option value="USD">USD</Select.Option>
          <Select.Option value="SUM">SUM</Select.Option>
          <Select.Option value="KGS">KGS</Select.Option>
        </Select>

        <Select
          value={paymentType}
          onChange={setPaymentType}
          placeholder="To‘lov usuli"
          style={{ width: "100%", marginTop: 12 }}
        >
          <Select.Option value="cash">Naqt</Select.Option>
          <Select.Option value="plastik">Plastik</Select.Option>
          <Select.Option value="transfer">Bank o‘tkazma</Select.Option>
        </Select>
      </Modal>
    </div>
  );
};

export default Debtors;
