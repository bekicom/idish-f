import React, { useState } from "react";
import { useGetProductsPartnerQuery } from "../../context/service/partner.service";
import {
  Card,
  Col,
  Row,
  Modal,
  Table,
  Typography,
  Space,
  Input,
  Select,
  message,
  Button,
} from "antd";
import { MdScale } from "react-icons/md";
import "./partner.css";
import {
  useGetActPartnersQuery,
  useDeleteActPartnerMutation,
} from "../../context/service/act-partner.service";
import { DeleteOutlined, EyeOutlined } from "@ant-design/icons";
const { Title, Text } = Typography;

const Partner = () => {
  const { data: hamkorMahsulotlari = [] } = useGetProductsPartnerQuery();
  const { data: partnersFromApi = [] } = useGetActPartnersQuery();
  const [deleteActPartner] = useDeleteActPartnerMutation();
  const [tanlanganHamkor, setTanlanganHamkor] = useState(null);
  const [modalKoʻrinadi, setModalKoʻrinadi] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [searchNumber, setSearchNumber] = useState("");
  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedPartiya, setSelectedPartiya] = useState("");

  const unikalManzillar = Array.from(
    new Set(partnersFromApi.map((p) => p.partner_address).filter(Boolean))
  );

  const filtrlanganMahsulotlar = tanlanganHamkor
    ? hamkorMahsulotlari.filter(
        (p) =>
          p.partner_number === tanlanganHamkor.partner_number &&
          (selectedPartiya ? p.part === selectedPartiya : true)
      )
    : [];

  const generatePDF = (partner_number, part) => {
    const partner = partnersFromApi.find(
      (p) => p.partner_number === partner_number
    );
    if (!partner) return alert("Hamkor topilmadi");

    const mahsulotlar = hamkorMahsulotlari.filter(
      (p) =>
        p.partner_number === partner_number && (part ? p.part === part : true)
    );

    const summaryByCurrency = ["USD", "SUM"].map((currency) => {
      const filtered = mahsulotlar.filter((p) => p.currency === currency);
      const boxSum = filtered.reduce((acc, p) => acc + p.box_quantity, 0);
      const totalKg = filtered.reduce((acc, p) => acc + p.total_kg, 0);
      const purchaseSum = filtered.reduce(
        (acc, p) => acc + p.purchasePrice.value * p.quantity,
        0
      );
      const sellingSum = filtered.reduce(
        (acc, p) => acc + p.sellingPrice.value * p.quantity,
        0
      );
      const profitSum = sellingSum - purchaseSum;

      return {
        currency,
        boxSum,
        totalKg,
        purchaseSum,
        sellingSum,
        profitSum,
      };
    });

    const htmlContent = `
    <html>
      <head>
        <title>Mahsulotlar hisoboti</title>
        <style>
          body { font-family: Arial; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #000; padding: 6px; text-align: left; }
          h2 { margin-bottom: 0; }
        </style>
      </head>
      <body>
        <h2>Hamkor tovarlari</h2>
        <p><strong>Ismi:</strong> ${partner.partner_name}</p>
        <p><strong>Raqam:</strong> ${partner.partner_number}</p>
        <p><strong>Manzil:</strong> ${partner.partner_address || "-"}</p>
        <p><strong>Partiya:</strong> ${part || "Barchasi"}</p>

        <table>
          <thead>
            <tr>
              <th>Valyuta</th>
              <th>Umumiy karobka soni</th>
              <th>Umumiy kg</th>
              <th>Umumiy tan summasi</th>
              <th>Umumiy sotish summasi</th>
              <th>Umumiy foyda summasi</th>
            </tr>
          </thead>
          <tbody>
            ${summaryByCurrency
              .map(
                (item) => `
              <tr>
                <td>${item.currency}</td>
                <td>${item.boxSum.toLocaleString()} ta</td>
                <td>${item.totalKg.toLocaleString()} kg</td>
                <td>${item.purchaseSum.toLocaleString()}</td>
                <td>${item.sellingSum.toLocaleString()}</td>
                <td>${item.profitSum.toLocaleString()}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <table>
          <thead>
            <tr>
              <th>Mahsulot</th>
              <th>Kategoriya</th>
              <th>Kod</th>
              <th>O‘lcham</th>
              <th>Kg</th>
              <th>Quti</th>
              <th>Valyuta</th>
              <th>Tan narx</th>
              <th>Sotish narx</th>
              <th>Ombor</th>
              <th>Um. tan summ</th>
              <th>Um. sot. summ</th>
            </tr>
          </thead>
          <tbody>
            ${mahsulotlar
              .map(
                (p) => `
              <tr>
                <td>${p.name}</td>
                <td>${p.category}</td>
                <td>${p.code}</td>
                <td>${p.size}</td>
                <td>${p.total_kg?.toFixed(2) || "-"}</td>
                <td>${p.box_quantity?.toFixed(2) || "-"}</td>
                <td>${p.currency}</td>
                <td>${p.purchasePrice?.value || "-"}</td>
                <td>${p.sellingPrice?.value?.toFixed(2) || "-"}</td>
                <td>${p.warehouse?.name || "-"}</td>
                <td>${(p.quantity * p.purchasePrice?.value)?.toFixed(2)}</td>
                <td>${(p.quantity * p.sellingPrice?.value)?.toFixed(2)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </body>
    </html>
  `;

    const newWindow = window.open("", "_blank");
    newWindow.document.write(htmlContent);
    newWindow.document.close();
    newWindow.focus();
    newWindow.print();
    newWindow.close();
  };

  const ustunlar = [
    {
      title: "Mahsulot",
      dataIndex: "name",
      key: "name",
      render: (matn, yozuv) => (
        <Space direction="vertical" size="small">
          {yozuv.image_url ? (
            <img
              src={yozuv.image_url}
              alt={yozuv.name}
              className="card-product-image"
            />
          ) : (
            <div className="card-no-image">Rasm yoʻq</div>
          )}
          <Text>{yozuv.name || "Nomaʼlum"}</Text>
        </Space>
      ),
    },
    {
      title: "Kategoriya",
      dataIndex: "category",
    },
    { title: "Kod", dataIndex: "code", key: "code" },
    { title: "Oʻlcham", dataIndex: "size", key: "size" },
    {
      title: "Umumiy vazn (kg)",
      dataIndex: "total_kg",
      key: "total_kg",
      render: (matn) => (matn ? matn?.toFixed(2) : "-"),
    },
    {
      title: "Quti soni",
      dataIndex: "box_quantity",
      key: "box_quantity",
      render: (matn) => (matn ? matn?.toFixed(2) : "-"),
    },
    { title: "Valyuta", dataIndex: "currency", key: "currency" },
    {
      title: "Sotib olish narxi",
      dataIndex: "purchasePrice",
      key: "purchasePrice",
      render: (matn, yozuv) => `${yozuv.purchasePrice?.value || "-"}`,
    },
    {
      title: "Sotish narxi",
      dataIndex: "sellingPrice",
      key: "sellingPrice",
      render: (matn, yozuv) =>
        `${yozuv.sellingPrice?.value?.toFixed(2) || "-"}`,
    },
    {
      title: "Ombor",
      dataIndex: "warehouse",
      key: "warehouse",
      render: (matn, yozuv) => yozuv?.warehouse?.name || "-",
    },
  ];

  const kartaBosish = (hamkor) => {
    setTanlanganHamkor(hamkor);
    setModalKoʻrinadi(true);
  };

  const modalYopish = () => {
    setModalKoʻrinadi(false);
    setTanlanganHamkor(null);
  };

  const deleteHamkor = async (e, hamkor) => {
    try {
      let res = await deleteActPartner(hamkor);
      if (res.error) {
        message.error(res.error.data.error);
        return;
      }
      message.success("Hamkor oʻchirildi");
    } catch (err) {
      console.log(err);
      message.error("Hamkor oʻchirilmadi");
    }
  };

  return (
    <div style={{ padding: "24px", background: "#f0f2f5", overflowX: "auto" }}>
      <Title level={2} style={{ color: "#001529", marginBottom: "24px" }}>
        Yetkazib beruvchilar
      </Title>
      <Space style={{ marginBottom: "24px" }}>
        <Input
          style={{ width: "300px" }}
          placeholder="Ismini kiriting"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
        <Input
          style={{ width: "200px" }}
          placeholder="Telefon raqam kiriting"
          value={searchNumber}
          onChange={(e) => setSearchNumber(e.target.value)}
        />
        <Select
          value={selectedAddress}
          onChange={(value) => setSelectedAddress(value)}
          placeholder={"Manzil bo'yicha saralash"}
          style={{ width: "200px" }}
        >
          <Select.Option value="">Barchasi</Select.Option>
          {unikalManzillar.map((manzil, indeks) => (
            <Select.Option key={indeks} value={manzil}>
              {manzil}
            </Select.Option>
          ))}
        </Select>
      </Space>
      <Row gutter={[16, 16]}>
        {partnersFromApi
          ?.filter((h) =>
            selectedAddress
              ? h.partner_address === selectedAddress
              : searchName
              ? h.partner_name
                  ?.toLowerCase()
                  .includes(searchName?.toLowerCase())
              : searchNumber
              ? h.partner_number
                  ?.toLowerCase()
                  .includes(searchNumber?.toLowerCase())
              : true
          )
          .map((hamkor, indeks) => (
            <Col xs={24} sm={12} md={8} lg={6} key={indeks}>
              <Card
                hoverable
                style={{
                  background: "#fff",
                  border: `1px solid ${
                    tanlanganHamkor?.partner_name === hamkor.partner_name
                      ? "#001529"
                      : "#d9d9d9"
                  }`,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                headStyle={{ background: "#001529", color: "#fff" }}
                title={
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    {/* <Button> */}
                    <EyeOutlined onClick={() => kartaBosish(hamkor)} />
                    {/* </Button> */}
                    <p> {hamkor.partner_name} </p>
                    <DeleteOutlined onClick={(e) => deleteHamkor(e, hamkor)} />
                  </div>
                }
              >
                <Text>Raqam: {hamkor.partner_number}</Text>
              </Card>
            </Col>
          ))}
      </Row>
      <Modal
        title={
          <Space>
            <MdScale style={{ fontSize: "20px", color: "#001529" }} />
            <Text strong style={{ color: "#001529" }}>
              {tanlanganHamkor?.partner_name} - Mahsulotlar haqida maʼlumot
            </Text>
            <Select
              style={{ width: "200px" }}
              onChange={setSelectedPartiya}
              value={selectedPartiya}
            >
              <Select.Option value={""}>Barchasi</Select.Option>
              {tanlanganHamkor?.parts.map((p) => (
                <Select.Option value={p.part}>{p.part}</Select.Option>
              ))}
            </Select>
            <Button
              type="primary"
              onClick={() =>
                generatePDF(tanlanganHamkor?.partner_number, selectedPartiya)
              }
            >
              Yuklab olish
            </Button>
          </Space>
        }
        open={modalKoʻrinadi}
        onCancel={modalYopish}
        footer={null}
        width={1600}
        bodyStyle={{ padding: "16px" }}
      >
        <table style={{ border: "1px solid #000", padding: "5px" }}>
          <thead>
            <tr style={{ border: "1px solid #000", padding: "5px" }}>
              <th style={{ border: "1px solid #000", padding: "5px" }}>
                Umumiy karobka soni
              </th>
              <th style={{ border: "1px solid #000", padding: "5px" }}>
                Umumiy kg
              </th>
              <th style={{ border: "1px solid #000", padding: "5px" }}>
                Valyuta
              </th>
              <th style={{ border: "1px solid #000", padding: "5px" }}>
                Umumiy tan summasi
              </th>
              <th style={{ border: "1px solid #000", padding: "5px" }}>
                Umumiy sotish summasi
              </th>
              <th style={{ border: "1px solid #000", padding: "5px" }}>
                Umumiy foyda summasi
              </th>
            </tr>
          </thead>
          <tbody>
            {["USD", "SUM"].map((currency) => {
              const filtered = filtrlanganMahsulotlar.filter(
                (p) => p.currency === currency
              );
              const boxSum = filtered.reduce(
                (acc, p) => acc + p.box_quantity,
                0
              );
              const totalKg = filtered.reduce((acc, p) => acc + p.total_kg, 0);
              const purchaseSum = filtered.reduce(
                (acc, p) => acc + p.purchasePrice.value * p.quantity,
                0
              );
              const sellingSum = filtered.reduce(
                (acc, p) => acc + p.sellingPrice.value * p.quantity,
                0
              );
              const profitSum = sellingSum - purchaseSum;

              return (
                <tr key={currency}>
                  <td style={{ border: "1px solid #000", padding: "5px" }}>
                    {boxSum?.toLocaleString()} ta
                  </td>
                  <td style={{ border: "1px solid #000", padding: "5px" }}>
                    {totalKg?.toLocaleString()} kg
                  </td>
                  <td style={{ border: "1px solid #000", padding: "5px" }}>
                    {currency}
                  </td>
                  <td style={{ border: "1px solid #000", padding: "5px" }}>
                    {purchaseSum?.toLocaleString()}
                  </td>
                  <td style={{ border: "1px solid #000", padding: "5px" }}>
                    {sellingSum?.toLocaleString()}
                  </td>
                  <td style={{ border: "1px solid #000", padding: "5px" }}>
                    {profitSum?.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <Table
          columns={ustunlar}
          size="small"
          dataSource={filtrlanganMahsulotlar}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: "max-content" }}
          style={{ border: "1px solid #f0f0f0" }}
        />
      </Modal>
    </div>
  );
};

export default Partner;
