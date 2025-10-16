import { Card, Statistic, Row, Col, Select, Modal, Table, message } from "antd";
import moment from "moment";
import { useGetStoresQuery } from "../../context/service/ombor.service";
import {
  useLazyGetDailyReportQuery, // ✅ yangi hook
} from "../../context/service/debt.service";
import { useEffect, useState } from "react";

const { Option } = Select;

const Daily = () => {
  const { data: stores = [] } = useGetStoresQuery();
  const [getDailyReport, { data: reportData, isFetching }] =
    useLazyGetDailyReportQuery();

  const today = moment().format("YYYY-MM-DD");
  const [date, setDate] = useState(today);
  const [selectedStore, setSelectedStore] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalData, setModalData] = useState([]);

  // 📊 Hisobotni olish
  useEffect(() => {
    if (selectedStore && date) {
      getDailyReport({
        date,
        storeId: selectedStore,
      })
        .unwrap()
        .catch(() => message.error("Hisobotni olishda xatolik!"));
    }
  }, [selectedStore, date]);

  // 🔍 Modal uchun ustunlar
  const columns = [
    {
      title: "Mahsulot nomi",
      dataIndex: ["productId", "name"],
      render: (name) => name || "-",
    },
    {
      title: "Mijoz",
      dataIndex: ["clientId", "name"],
      render: (v) => v || "-",
    },
    {
      title: "Summasi",
      dataIndex: "totalAmount",
      render: (val) => (val ? val.toFixed(2) : "-"),
    },
    {
      title: "Valyuta",
      dataIndex: "currency",
    },
    {
      title: "Sana",
      dataIndex: "createdAt",
      render: (v) =>
        v
          ? moment(v).format("DD.MM.YYYY HH:mm")
          : moment().format("DD.MM.YYYY"),
    },
  ];

  const summary = reportData?.summary || {};
  const details = reportData?.details || {};

  return (
    <div style={{ padding: "20px" }}>
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              height: "33px",
              paddingInline: "10px",
              borderRadius: "5px",
              border: "1px solid #ccc",
            }}
          />
        </Col>
        <Col>
          <Select
            placeholder="Do'kon tanlang"
            style={{ width: 200 }}
            value={selectedStore}
            onChange={(val) => setSelectedStore(val)}
          >
            {stores.map((store) => (
              <Option key={store._id} value={store._id}>
                {store.name}
              </Option>
            ))}
          </Select>
        </Col>
      </Row>

      {selectedStore && (
        <Row gutter={16}>
          <Col span={8}>
            <Card
              onClick={() => {
                setModalTitle("💰 Sotuvlar (USD)");
                setModalData(details.salesUSD || []);
                setModalVisible(true);
              }}
              hoverable
            >
              <Statistic
                title="Sotuv (USD)"
                value={summary.totalSalesUSD?.toFixed(2) || 0}
                suffix="$"
                valueStyle={{ color: "#3f8600" }}
              />
            </Card>
          </Col>

          <Col span={8}>
            <Card
              onClick={() => {
                setModalTitle("💵 Qarzlar (USD)");
                setModalData(details.debtsUSD || []);
                setModalVisible(true);
              }}
              hoverable
            >
              <Statistic
                title="Qarzlar (USD)"
                value={summary.totalDebtsUSD?.toFixed(2) || 0}
                suffix="$"
                valueStyle={{ color: "#ff4d4f" }}
              />
            </Card>
          </Col>

          <Col span={8}>
            <Card
              onClick={() => {
                setModalTitle("💸 To‘lovlar (USD)");
                setModalData(details.paymentsUSD || []);
                setModalVisible(true);
              }}
              hoverable
            >
              <Statistic
                title="To‘lovlar (USD)"
                value={summary.totalPaymentsUSD?.toFixed(2) || 0}
                suffix="$"
                valueStyle={{ color: "#1677ff" }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 🔹 Tafsilotlar Modali */}
      <Modal
        title={modalTitle}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <Table
          dataSource={modalData}
          columns={columns}
          rowKey={(r, i) => i}
          pagination={{ pageSize: 5 }}
        />
      </Modal>
    </div>
  );
};

export default Daily;
