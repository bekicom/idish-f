import React, { useEffect, useState } from "react";
import { useGetSalesHistoryQuery } from "../../context/service/sales.service";
import { DatePicker, Input, Select, Table, Button, Space } from "antd";
import { PrinterOutlined, EditOutlined } from "@ant-design/icons";
import moment from "moment";
import { useGetClientsQuery } from "../../context/service/client.service";
import { useGetProductsQuery } from "../../context/service/product.service";
import { useGetProductsPartnerQuery } from "../../context/service/partner.service";
import { FaPrint, FaEdit } from "react-icons/fa";
import { useGetUsdRateQuery } from "../../context/service/usd.service";
import { groupBy } from "lodash";
import EditSaleModal from "../../components/editmodal/EditSaleModal"; // Modal komponentini import qiling

const { Option } = Select;

const Sales = () => {
  const { data: clients = [] } = useGetClientsQuery();
  const { data: mahsulotlar = [] } = useGetProductsQuery();
  const { data: hamkorMahsulotlari = [] } = useGetProductsPartnerQuery();
  const { data: usdRateData = {} } = useGetUsdRateQuery();

  // Modal uchun state-lar qo'shamiz
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);

  const [searchName, setSearchName] = useState("");
  const [searchNumber, setSearchNumber] = useState("");
  const barchaMahsulotlar = [
    ...mahsulotlar.map((mahsulot) => ({
      ...mahsulot,
      manba: "mahsulot",
      hamkor_nomi: mahsulot.name_partner || "",
      hamkor_raqami: mahsulot.partner_number || "",
    })),
    ...hamkorMahsulotlari.map((mahsulot) => ({
      ...mahsulot,
      manba: "hamkor",
      hamkor_nomi: mahsulot.name_partner || "",
      hamkor_raqami: mahsulot.partner_number || "",
    })),
  ];
  const unikalHamkorlar = Array.from(
    new Map(
      barchaMahsulotlar
        .filter((p) => p.hamkor_nomi && p.hamkor_raqami)
        .map((p) => [
          p.hamkor_nomi,
          { nom: p.hamkor_nomi, raqam: p.hamkor_raqami },
        ])
    ).values()
  );

  const { data: sales = [], isLoading, refetch } = useGetSalesHistoryQuery();
  const [filters, setFilters] = useState({
    productName: "",
    productCode: "",
    paymentMethod: "",
    dateRange: [],
    selectedClient: "",
  });
  const [filteredSales, setFilteredSales] = useState([]);

  useEffect(() => {
    setFilteredSales(
      sales.filter((sale) => {
        const matchesProductName = sale.productId?.name
          ?.toLowerCase()
          .includes(filters.productName?.toLowerCase());
        const matchesProductCategory = sale.productId?.category
          ?.toLowerCase()
          .includes(filters.productName?.toLowerCase());
        const matchesProductCode = sale.productId?.code
          ?.toLowerCase()
          .includes(filters.productName?.toLowerCase());
        const matchesProductSize = sale.productId?.size
          ?.toLowerCase()
          .includes(filters.productName?.toLowerCase());

        const matchesClient = filters.selectedClient
          ? sale.clientId?._id === filters.selectedClient
          : true;

        const matchesPaymentMethod =
          !filters.paymentMethod ||
          sale.paymentMethod === filters.paymentMethod;
        const matchesDateRange =
          !filters.dateRange.length ||
          (moment(sale.createdAt).isSameOrAfter(
            moment(filters.dateRange[0]),
            "day"
          ) &&
            moment(sale.createdAt).isSameOrBefore(
              moment(filters.dateRange[1]),
              "day"
            ));
        return (
          (matchesProductName ||
            matchesProductCategory ||
            matchesProductCode ||
            matchesProductSize) &&
          matchesPaymentMethod &&
          matchesDateRange &&
          matchesClient
        );
      })
    );
  }, [filters, sales]);

  // Modal ochish uchun funksiya
  const openEditModal = (sale) => {
    setSelectedSale(sale);
    setEditModalVisible(true);
  };

  // Modal yopish uchun funksiya
  const closeEditModal = (shouldRefresh) => {
    setEditModalVisible(false);
    setSelectedSale(null);
    // Agar o'zgarish bo'lgan bo'lsa, ma'lumotlarni yangilaymiz
    if (shouldRefresh) {
      refetch();
    }
  };

  const generatePDF = (sale) => {
    const printWindow = window.open("", "", "width=600,height=600");

    if (!printWindow) {
      alert("Iltimos, brauzeringizda pop-up oynalarni ruxsat bering!");
      return;
    }

    const totalPrice = (sale.sellingPrice || 0) * (sale.quantity || 0);
    const paymentMethodText =
      sale.paymentMethod === "cash"
        ? "Naqd"
        : sale.paymentMethod === "card"
        ? "Karta"
        : "Noma'lum";

    const buyerName = sale.clientId?.name || sale.partnerName || "Noma'lum";

    const tableRow = `
      <tr>
        <td>1</td>
        <td>${sale.productId?.name || "Noma'lum mahsulot"}</td>
        <td>${sale.quantity || 0}</td>
        <td>${sale.sellingPrice || 0}</td>
        <td>${totalPrice.toLocaleString()}</td>
        <td>${paymentMethodText}</td>
        <td>${moment(sale.createdAt).format("DD.MM.YYYY HH:mm")}</td>
      </tr>
    `;

    const content = `
      <div style="width:210mm; height:297mm; padding:20px; font-family:Arial, sans-serif; color:#001529;">
        <h2 style="text-align:center; margin-bottom:20px;">
          ${moment().format("DD.MM.YYYY")} даги Хисобварак-фактура
        </h2>
        <div style="display:flex; justify-content:space-between; margin-bottom:20px;">
          <div>
            <b>Етказиб берувчи:</b><br/>
            <p>${localStorage.getItem("user_login") || "Noma'lum"}</p>
          </div>
          <div>
            <b>Сотиб олувчи:</b><br/>
            <p>${buyerName}</p>
          </div>
        </div>
        <table border="1" style="border-collapse:collapse; width:100%; text-align:center;">
          <thead style="background:#001529; color:white;">
            <tr>
              <th>No</th>
              <th>Mahsulot nomi</th>
              <th>Soni</th>
              <th>Sotish narxi</th>
              <th>Umumiy summa</th>
              <th>To'lov usuli</th>
              <th>Sotish sanasi</th>
            </tr>
          </thead>
          <tbody>${tableRow}</tbody>
        </table>
      </div>
    `;

    printWindow.document.write(`
      <html>
        <head><title>Хисобварак-фактура - ${buyerName}</title></head>
        <body>${content}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  const columns = [
    {
      title: "Haridor",
      key: "buyer",
      render: (_, record) => {
        if (record.clientId?.name) return record.clientId.name;

        const hamkor = unikalHamkorlar.find(
          (h) => h.raqam === record.partnerId
        );
        return hamkor?.nom || "Noma'lum";
      },
    },
    {
      title: "Mahsulot nomi",
      dataIndex: ["productId", "name"],
      key: "productId",
    },
    {
      title: "Mahsulot kategoriyasi",
      dataIndex: ["productId", "category"],
      key: "productId",
    },
    {
      title: "Mahsulot kodi",
      dataIndex: ["productId", "code"],
      key: "productId",
    },
    {
      title: "Mahsulot o'lchami",
      dataIndex: ["productId", "size"],
      key: "productId",
    },
    { title: "Ombor", dataIndex: ["warehouseId", "name"], key: "warehouseId" },
    { title: "Soni", dataIndex: "quantity", key: "quantity" },
    {
      title: "To'lov usuli",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      render: (text) =>
        text === "cash" ? "Naqd" : text === "card" ? "Karta" : "Qarz",
    },
    {
      title: "Sotib olish narxi",
      key: "purchasePrice",
      render: (_, record) =>
        `${record.productId?.purchasePrice?.value || 0} ${
          record.productId?.currency || "N/A"
        }`,
    },
    {
      title: "Sotish narxi",
      render: (_, record) =>
        record.sellingPrice
          ? `${Number(record.sellingPrice?.toFixed(2))?.toLocaleString()} ${
              record.currency
            }`
          : "0.00",
    },
    {
      title: "Jami",
      render: (_, record) =>
        record.sellingPrice
          ? `${Number(
              (record.sellingPrice * record.quantity)?.toFixed(2)
            )?.toLocaleString()} ${record.currency}`
          : "0.00",
    },
    {
      title: "Sotish sanasi",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => moment(text).format("DD.MM.YYYY HH:mm"),
    },
    {
      title: "Harakat",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<FaPrint />}
            onClick={() => generatePDF(record)}
          >
            Chop etish
          </Button>
          <Button
            type="default"
            icon={<FaEdit />}
            onClick={() => openEditModal(record)}
          >
            Tahrirlash
          </Button>
        </Space>
      ),
    },
  ];

  const groupedColumns = [
    {
      title: "Haridor",
      dataIndex: "buyer",
      key: "buyer",
    },
    {
      title: "Sotish sanasi",
      dataIndex: "saleDate",
      key: "saleDate",
    },
    {
      title: "Jami summa",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (text) => `${Number(text)?.toLocaleString()}`,
    },
  ];

  const groupedSales = Object.values(
    filteredSales.reduce((acc, sale) => {
      const buyerId = sale.clientId?._id || sale.partnerId || "unknown";
      const saleDay = moment(sale.saleDate || sale.createdAt).format(
        "DD.MM.YYYY"
      );
      const groupKey = `${buyerId}-${saleDay}`;

      if (!acc[groupKey]) {
        acc[groupKey] = {
          _id: groupKey,
          key: groupKey,
          buyer:
            sale.clientId?.name ||
            unikalHamkorlar.find((h) => h.raqam === sale.partnerId)?.nom ||
            "Noma'lum",
          saleDate: saleDay,
          totalAmount: 0,
          children: [],
        };
      }

      const total = (sale.sellingPrice || 0) * (sale.quantity || 0);
      acc[groupKey].totalAmount += total;
      acc[groupKey].children.push(sale);

      return acc;
    }, {})
  );

  const expandedRowRender = (record) => {
    const columns = [
      { title: "Mahsulot nomi", dataIndex: ["productId", "name"], key: "name" },
      {
        title: "Mahsulot kategoriyasi",
        dataIndex: ["productId", "category"],
        key: "category",
      },
      { title: "Mahsulot kodi", dataIndex: ["productId", "code"], key: "code" },
      {
        title: "Mahsulot o'lchami",
        dataIndex: ["productId", "size"],
        key: "size",
      },
      { title: "Ombor", dataIndex: ["warehouseId", "name"], key: "warehouse" },
      { title: "Soni", dataIndex: "quantity", key: "quantity" },
      {
        title: "To'lov usuli",
        dataIndex: "paymentMethod",
        key: "paymentMethod",
        render: (text) =>
          text === "cash" ? "Naqd" : text === "card" ? "Karta" : "Qarz",
      },
      {
        title: "Sotib olish narxi",
        key: "purchasePrice",
        render: (_, record) =>
          `${record.productId?.purchasePrice?.value || 0} ${
            record.productId?.currency || "N/A"
          }`,
      },
      {
        title: "Sotish narxi",
        render: (_, record) =>
          record.sellingPrice
            ? `${Number(record.sellingPrice?.toFixed(2))?.toLocaleString()} ${
                record.currency
              }`
            : "0.00",
      },
      {
        title: "Sotish sanasi",
        dataIndex: "createdAt",
        render: (text) => moment(text).format("DD.MM.YYYY HH:mm"),
      },
      {
        title: "Harakat",
        key: "actions",
        render: (_, saleRecord) => (
          <Space>
            <Button
              type="primary"
              size="small"
              icon={<FaPrint />}
              onClick={() => generatePDF(saleRecord)}
            >
              Chop
            </Button>
            <Button
              type="default"
              size="small"
              icon={<FaEdit />}
              onClick={() => openEditModal(saleRecord)}
            >
              Tahrir
            </Button>
          </Space>
        ),
      },
    ];

    return (
      <Table
        columns={columns}
        dataSource={record.children}
        pagination={false}
        rowKey="_id"
      />
    );
  };

  if (isLoading) {
    return <div>Yuklanmoqda...</div>;
  }

  return (
    <div className="sales-page" style={{ overflowX: "auto" }}>
      <div className="page_header">
        <div className="header_actions">
          <Space style={{ display: "flex", alignItems: "start" }}>
            <Space direction="vertical">
              <Select
                style={{ width: "200px" }}
                onChange={(value) =>
                  setFilters({ ...filters, selectedClient: value })
                }
                value={filters.selectedClient}
              >
                <Option value="">Barchasi</Option>
                {clients.map((client) => (
                  <Option key={client._id} value={client._id}>
                    {client.name}
                  </Option>
                ))}
              </Select>
              <Select
                style={{ width: "200px" }}
                placeholder="To'lov usuli"
                onChange={(value) =>
                  setFilters({ ...filters, paymentMethod: value })
                }
                value={filters.paymentMethod}
              >
                <Option value="">Barchasi</Option>
                <Option value="cash">Naqd</Option>
                <Option value="card">Karta</Option>
              </Select>
            </Space>
            <Space direction="vertical">
              <Input
                style={{ width: "250px" }}
                placeholder="Mahsulot nomi"
                onChange={(e) =>
                  setFilters({ ...filters, productName: e.target.value })
                }
              />
              <DatePicker.RangePicker
                style={{ width: "250px" }}
                placeholder={["Dan", "Gacha"]}
                onChange={(dates, dateStrings) => {
                  if (!dateStrings[0] || !dateStrings[1]) {
                    setFilters({ ...filters, dateRange: [] });
                  } else {
                    setFilters({ ...filters, dateRange: dateStrings });
                  }
                }}
              />
            </Space>
            <table
              style={{
                border: "1px solid #000",
                width: "300px",
                padding: "5px",
              }}
            >
              <tr
                style={{
                  border: "1px solid #000",
                  padding: "5px",
                }}
              >
                <td style={{ border: "1px solid #ccc", padding: "5px" }}>
                  Valyuta
                </td>
                <td style={{ border: "1px solid #ccc", padding: "5px" }}>
                  Sof foyda
                </td>
                <td style={{ border: "1px solid #ccc", padding: "5px" }}>
                  Sotuv
                </td>
              </tr>
              <tr
                style={{
                  border: "1px solid #000",
                  padding: "5px",
                }}
              >
                <td style={{ border: "1px solid #ccc", padding: "5px" }}>
                  USD
                </td>
                <td style={{ border: "1px solid #ccc", padding: "5px" }}>
                  {filteredSales
                    .filter((s) => s.currency === "USD")
                    .reduce(
                      (acc, item) =>
                        acc +
                        (item.sellingPrice -
                          item.productId.purchasePrice.value) *
                          item.quantity,
                      0
                    )
                    ?.toFixed(2)}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "5px" }}>
                  {filteredSales
                    .filter((s) => s.currency === "USD")
                    .reduce(
                      (acc, item) => acc + item.sellingPrice * item.quantity,
                      0
                    )}
                </td>
              </tr>
              <tr
                style={{
                  border: "1px solid #000",
                  padding: "5px",
                }}
              >
                <td style={{ border: "1px solid #ccc", padding: "5px" }}>
                  UZS
                </td>
                <td style={{ border: "1px solid #ccc", padding: "5px" }}>
                  {filteredSales
                    .filter((s) => s.currency === "SUM")
                    .reduce(
                      (acc, item) =>
                        acc +
                        (item.sellingPrice -
                          item.productId.purchasePrice.value *
                            usdRateData.rate) *
                          item.quantity,
                      0
                    )
                    ?.toLocaleString()}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "5px" }}>
                  {filteredSales
                    .filter((s) => s.currency === "SUM")
                    .reduce(
                      (acc, item) => acc + item.sellingPrice * item.quantity,
                      0
                    )
                    ?.toLocaleString()}
                </td>
              </tr>
              <tr
                style={{
                  border: "1px solid #000",
                  padding: "5px",
                }}
              >
                <td style={{ border: "1px solid #ccc", padding: "5px" }}>
                  KGS
                </td>
                <td style={{ border: "1px solid #ccc", padding: "5px" }}>
                  {filteredSales
                    .filter((s) => s.currency === "KGS")
                    .reduce(
                      (acc, item) =>
                        acc +
                        (item.sellingPrice -
                          item.productId.purchasePrice.value *
                            usdRateData.kgs) *
                          item.quantity,
                      0
                    )
                    ?.toLocaleString()}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "5px" }}>
                  {filteredSales
                    .filter((s) => s.currency === "KGS")
                    .reduce(
                      (acc, item) => acc + item.sellingPrice * item.quantity,
                      0
                    )
                    ?.toLocaleString()}
                </td>
              </tr>
            </table>
          </Space>
        </div>
      </div>

      <Table
        scroll={{ x: "max-content" }}
        rowKey="_id"
        columns={groupedColumns}
        dataSource={groupedSales}
        expandable={{ expandedRowRender }}
      />

      {/* Edit Modal komponentini qo'shamiz */}
      <EditSaleModal
        visible={editModalVisible}
        onClose={closeEditModal}
        sale={selectedSale}
      />
    </div>
  );
};

export default Sales;
