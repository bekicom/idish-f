import { useState, useMemo } from "react";
import { Select, Table, Input, Button, Space } from "antd";
import { useGetClientsQuery } from "../../context/service/client.service";
import { useGetAllDebtorsQuery } from "../../context/service/debt.service";
import { useGetProductsPartnerQuery } from "../../context/service/partner.service";
import { useGetSalesHistoryQuery } from "../../context/service/sales.service";
import dayjs from "dayjs";
import { useGetActPartnersQuery } from "../../context/service/act-partner.service";
import { FaArrowLeft } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { useGetAllReportsQuery } from "../../context/service/report.service";

const ReconciliationAct = () => {
  const { data: partnerProducts = [] } = useGetProductsPartnerQuery();
  const { data: sales = [] } = useGetSalesHistoryQuery();
  const { data: debts = [] } = useGetAllDebtorsQuery();
  const { data: reports = [] } = useGetAllReportsQuery();
  const { data: clients = [] } = useGetClientsQuery();
  const { data: partnersFromApi = [], isLoading: partnersLoading } =
    useGetActPartnersQuery();
  const navigate = useNavigate();

  const [selectedPartner, setSelectedPartner] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [focused, setFocused] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const allPartners = useMemo(() => {
    const map = new Map();
    partnerProducts.forEach((p) => {
      if (!map.has(p.partner_number)) {
        map.set(p.partner_number, p.name_partner);
      }
    });
    return Array.from(map.entries()).map(([number, name]) => ({
      value: number,
      label: name,
    }));
  }, [partnerProducts]);

  const isInDateRange = (date) => {
    if (!startDate || !endDate) return true;
    const d = dayjs(date);
    return (
      d.isAfter(dayjs(startDate).startOf("day")) &&
      d.isBefore(dayjs(endDate).endOf("day"))
    );
  };

  const filteredSales = useMemo(() => {
    return (sales || []).filter((item) => {
      const matchDate = isInDateRange(item.createdAt);
      if (selectedClient)
        return item.clientId?._id === selectedClient && matchDate;
      if (selectedPartner) return item.partnerId && matchDate;
      return false;
    });
  }, [sales, selectedClient, selectedPartner, startDate, endDate]);

  const filteredDebts = useMemo(() => {
    return (debts || []).filter((item) => {
      const matchDate = isInDateRange(item.createdAt);
      if (selectedClient)
        return item.clientId?._id === selectedClient && matchDate;
      if (selectedPartner)
        return item.partnerId === selectedPartner && matchDate;
      return false;
    });
  }, [debts, selectedClient, selectedPartner, startDate, endDate]);

  const filteredAstatkaPayments = useMemo(() => {
    if (!Array.isArray(reports)) return [];
    return reports.filter((item) => {
      if (item.type !== "payment") return false;

      const matchDate = isInDateRange(item.createdAt);

      if (selectedClient)
        return (
          item.clientId === selectedClient ||
          (item.clientId?._id === selectedClient && matchDate)
        );

      if (selectedPartner)
        return item.partnerId === selectedPartner && matchDate;

      return false;
    });
  }, [reports, selectedClient, selectedPartner, startDate, endDate]);

  const filteredAstatkaDebts = useMemo(() => {
    return (reports || [])
      .filter((item) => item.type === "debt")
      .filter((item) => isInDateRange(item.createdAt))
      .map((item) => ({
        _id: item._id || Math.random().toString(),
        clientId: item.clientId || null,
        partnerId: item.partnerId || null,
        paymentMethod: "credit",
        status: "pending",
        productId: {
          name:
            item.productId?.name || item.productName || "Mahsulot nomi yo'q",
          code: item.productId?.code || item.productCode || "-",
          size: item.productId?.size || item.productSize || "-",
        },
        quantity: item.quantity || item.productQuantity || 0,
        unit: item.unit || "quantity",
        sellingPrice: item.sellingPrice || item.price || 0,
        totalAmount: item.amount || 0,
        currency: item.currency || "USD",
        remainingAmount: item.remainingAmount || item.amount || 0,
        createdAt: item.createdAt,
      }));
  }, [reports, selectedClient, selectedPartner, startDate, endDate]);

  const filteredPartnerProducts = useMemo(() => {
    return (partnerProducts || []).filter(
      (item) =>
        item.partner_number === selectedPartner && isInDateRange(item.createdAt)
    );
  }, [partnerProducts, selectedPartner, startDate, endDate]);

  const quantityText = {
    quantity: "Dona",
    package_quantity: "Pachka",
    box_quantity: "Karobka",
  };

  const safeGet = (obj, path, defaultValue = "Не указан") => {
    try {
      const result = path
        .split(".")
        .reduce((current, key) => current?.[key], obj);
      return result !== undefined && result !== null ? result : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const formatNumber = (num, defaultValue = "0.00") => {
    if (num === undefined || num === null || isNaN(num)) return defaultValue;
    return Number(num).toFixed(2);
  };

  const safeRender = (value, defaultValue = "Не указан") => {
    if (value === undefined || value === null || value === "") {
      return defaultValue;
    }
    return value;
  };

  const productReport = useMemo(() => {
    if (!selectedPartner || !partnerProducts.length) return [];

    const filteredProducts = partnerProducts.filter(
      (p) => p.partner_number === selectedPartner && isInDateRange(p.createdAt)
    );

    const inactiveParts =
      partnersFromApi
        .find((p) => p.partner_number === selectedPartner)
        ?.parts?.filter((p) => p.status === "inactive") || [];

    const report = inactiveParts.map((part) => {
      const filteredAndPartUnitedProducts = filteredProducts.filter(
        (p) => p.part === part.part
      );

      if (filteredAndPartUnitedProducts.length === 0) return null;

      return {
        _id: Math.random().toString(),
        partnerId: selectedPartner,
        amount: filteredAndPartUnitedProducts.reduce(
          (acc, p) => acc + (p.quantity || 0) * (p.purchasePrice?.value || 0),
          0
        ),
        currency: "USD",
        createdAt: filteredAndPartUnitedProducts[0].createdAt,
      };
    });

    return report.filter(Boolean);
  }, [selectedPartner, partnerProducts, partnersFromApi, startDate, endDate]);

  const summaryByCurrency = useMemo(() => {
    const result = {
      USD: { sales: 0, balance: 0, debt: 0, products: 0 },
      SUM: { sales: 0, balance: 0, debt: 0, products: 0 },
      KGS: { sales: 0, balance: 0, debt: 0, products: 0 },
    };

    const allDebts = (filteredDebts || []).concat(filteredAstatkaDebts || []);

    (filteredSales || []).forEach((s) => {
      if (result[s.currency]) {
        result[s.currency].sales += (s.sellingPrice || 0) * (s.quantity || 0);
      }
    });

    (filteredAstatkaPayments || []).forEach((p) => {
      if (result[p.currency]) {
        result[p.currency].balance += p.amount || 0;
      }
    });

    (productReport || []).forEach((p) => {
      if (result[p.currency]) {
        result[p.currency].balance += p.amount || 0;
      }
    });

    allDebts.forEach((d) => {
      if (result[d.currency]) {
        result[d.currency].debt += d.remainingAmount || 0;
      }
    });

    (filteredPartnerProducts || []).forEach((p) => {
      if (result[p.currency]) {
        result[p.currency].products +=
          (p.purchasePrice?.value || 0) * (p.quantity || 0);
      }
    });

    Object.keys(result).forEach((currency) => {
      result[currency].balance -= result[currency].debt;
    });

    return result;
  }, [
    filteredSales,
    filteredDebts,
    filteredPartnerProducts,
    filteredAstatkaPayments,
    filteredAstatkaDebts,
    productReport,
  ]);

  const printPDF = () => {
    let content = `
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      border: 1px solid #000;
      padding: 5px;
      text-align: left;
      font-size: 12px;
    }
  </style>
</head>
<body>
`;

    const allDebts = (filteredDebts || []).concat(filteredAstatkaDebts || []);

    const calcBalance = (currency) => {
      const payments = (filteredAstatkaPayments || [])
        .concat(productReport || [])
        .filter((p) => p.currency === currency)
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      const debts = allDebts
        .filter((d) => d.currency === currency)
        .reduce((sum, d) => sum + (d.remainingAmount || 0), 0);

      const products = selectedPartner
        ? (filteredPartnerProducts || [])
            .filter((p) => p.currency === currency)
            .reduce(
              (sum, p) =>
                sum + safeGet(p, "purchasePrice.value", 0) * (p.quantity || 0),
              0
            )
        : 0;

      return (payments - debts).toFixed(2);
    };

    content += `
<h2>Oldi-berdi</h2>
<table>
  <thead>
    <tr>
      <th>USD</th>
      <th>SUM</th>
      <th>KGS</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>${calcBalance("USD")} USD</td>
      <td>${calcBalance("SUM")} SUM</td>
      <td>${calcBalance("KGS")} KGS</td>
    </tr>
  </tbody>
</table>
`;

    if (selectedClient) {
      const client = clients.find((c) => c._id === selectedClient) || {};
      content += `
  <h2>Клиент: ${safeGet(client, "name")}</h2>
  <p>Номер телефона: ${safeGet(client, "phone")}</p>
  <p>Адрес: ${safeGet(client, "address")}</p>
`;

      content += `<h2>Продажи</h2><table><thead><tr>
  <th>Продукт</th><th>Количество</th><th>размер</th><th>koд</th><th>Единство</th><th>Цена</th><th>Валюта</th><th>Общий</th>
</tr></thead><tbody>`;

      let salesUSD = 0,
        salesSUM = 0,
        salesKGS = 0;

      (filteredSales || []).forEach((item) => {
        const quantity = item.quantity || 0;
        const sellingPrice = item.sellingPrice || 0;
        const total = quantity * sellingPrice;
        const currency = item.currency || "USD";

        if (currency === "USD") salesUSD += total;
        else if (currency === "SUM") salesSUM += total;
        else if (currency === "KGS") salesKGS += total;

        content += `<tr>
    <td>${safeGet(item, "productId.name")}</td>
    <td>${quantity}</td>
    <td>${safeGet(item, "productId.size")}</td>
    <td>${safeGet(item, "productId.code")}</td>
    <td>${quantityText[item.unit] || safeRender(item.unit)}</td>
    <td>${formatNumber(sellingPrice)}</td>
    <td>${currency}</td>
    <td>${formatNumber(total)}</td>
  </tr>`;
      });

      content += `<tr>
    <td colspan="2"><strong>${formatNumber(salesUSD)} USD</strong></td>
    <td colspan="2"><strong>${formatNumber(salesSUM)} SUM</strong></td>
    <td colspan="2"><strong>${formatNumber(salesKGS)} KGS</strong></td>
  </tr>`;

      content += `</tbody></table>`;

      content += `<h2>Долги</h2><table><thead><tr>
  <th>Продукт</th><th>Количество</th><th>Единство</th><th>Цена</th><th>Валюта</th><th>Общий</th><th>Остальные</th>
</tr></thead><tbody>`;

      let debtUSD = 0,
        debtSUM = 0,
        debtKGS = 0;

      allDebts.forEach((item) => {
        const currency = item.currency || "USD";
        const remainingAmount = item.remainingAmount || 0;

        if (currency === "USD") debtUSD += remainingAmount;
        else if (currency === "SUM") debtSUM += remainingAmount;
        else if (currency === "KGS") debtKGS += remainingAmount;

        content += `<tr>
    <td>${safeGet(item, "productId.name")}</td>
    <td>${safeRender(item.quantity)}</td>
    <td>${quantityText[item.unit] || safeRender(item.unit)}</td>
    <td>${formatNumber(item.sellingPrice)}</td>
    <td>${currency}</td>
    <td>${formatNumber(item.totalAmount)}</td>
    <td>${formatNumber(remainingAmount)}</td>
  </tr>`;
      });

      content += `<tr>
    <td colspan="2"><strong>${formatNumber(debtUSD)} USD</strong></td>
    <td colspan="2"><strong>${formatNumber(debtSUM)} SUM</strong></td>
    <td colspan="3"><strong>${formatNumber(debtKGS)} KGS</strong></td>
  </tr>`;

      content += `</tbody></table>`;
    }

    if (selectedPartner) {
      const partner =
        allPartners.find((p) => p.value === selectedPartner) || {};
      content += `
  <h2>Партнер: ${safeGet(partner, "label")}</h2>
  <p>Номер телефона: ${safeGet(partner, "value")}</p>
`;

      content += `<h2>Продажи</h2><table><thead><tr>
  <th>Продукт</th><th>Количество</th><th>размер</th><th>koд</th><th>Единство</th><th>Цена</th><th>Валюта</th><th>Общий</th>
</tr></thead><tbody>`;

      let salesUSD = 0,
        salesSUM = 0,
        salesKGS = 0;

      (filteredSales || []).forEach((item) => {
        const quantity = item.quantity || 0;
        const sellingPrice = item.sellingPrice || 0;
        const total = quantity * sellingPrice;
        const currency = item.currency || "USD";

        if (currency === "USD") salesUSD += total;
        else if (currency === "SUM") salesSUM += total;
        else if (currency === "KGS") salesKGS += total;

        content += `<tr>
    <td>${safeGet(item, "productId.name")}</td>
    <td>${quantity}</td>
    <td>${safeGet(item, "productId.size")}</td>
    <td>${safeGet(item, "productId.code")}</td>
    <td>${quantityText[item.unit] || safeRender(item.unit)}</td>
    <td>${formatNumber(sellingPrice)}</td>
    <td>${currency}</td>
    <td>${formatNumber(total)}</td>
  </tr>`;
      });

      content += `<tr>
    <td colspan="2"><strong>${formatNumber(salesUSD)} USD</strong></td>
    <td colspan="2"><strong>${formatNumber(salesSUM)} SUM</strong></td>
    <td colspan="2"><strong>${formatNumber(salesKGS)} KGS</strong></td>
  </tr>`;

      content += `</tbody></table>`;

      content += `<h2>Долги</h2><table><thead><tr>
  <th>Продукт</th><th>Количество</th><th>Единство</th><th>Цена</th><th>Валюта</th><th>Общий</th><th>Остальные</th>
</tr></thead><tbody>`;

      let debtUSD = 0,
        debtSUM = 0,
        debtKGS = 0;

      allDebts.forEach((item) => {
        const currency = item.currency || "USD";
        const remainingAmount = item.remainingAmount || 0;

        if (currency === "USD") debtUSD += remainingAmount;
        else if (currency === "SUM") debtSUM += remainingAmount;
        else if (currency === "KGS") debtKGS += remainingAmount;

        content += `<tr>
    <td>${safeGet(item, "productId.name")}</td>
    <td>${safeRender(item.quantity)}</td>
    <td>${quantityText[item.unit] || safeRender(item.unit)}</td>
    <td>${formatNumber(item.sellingPrice)}</td>
    <td>${currency}</td>
    <td>${formatNumber(item.totalAmount)}</td>
    <td>${formatNumber(remainingAmount)}</td>
  </tr>`;
      });

      content += `<tr>
    <td colspan="2"><strong>${formatNumber(debtUSD)} USD</strong></td>
    <td colspan="2"><strong>${formatNumber(debtSUM)} SUM</strong></td>
    <td colspan="3"><strong>${formatNumber(debtKGS)} KGS</strong></td>
  </tr>`;

      content += `</tbody></table>`;

      content += `<h2>Товары партнёра</h2><table><thead><tr>
  <th>Продукт</th><th>Размер</th><th>Количество</th><th>Пачка</th><th>Каробка</th><th>Цена покупки</th><th>Цена продажи</th><th>Валюта</th><th>Общий</th>
</tr></thead><tbody>`;

      let prodUSD = 0,
        prodSUM = 0,
        prodKGS = 0;

      (filteredPartnerProducts || []).forEach((item) => {
        const quantity = item.quantity || 0;
        const purchasePrice = safeGet(item, "purchasePrice.value", 0);
        const total = quantity * purchasePrice;
        const currency = item.currency || "USD";

        if (currency === "USD") prodUSD += total;
        else if (currency === "SUM") prodSUM += total;
        else if (currency === "KGS") prodKGS += total;

        content += `<tr>
    <td>${safeRender(item.name)}</td>
    <td>${safeRender(item.size)}</td>
    <td>${quantity}</td>
    <td>${safeRender(item.package_quantity)}</td>
    <td>${safeRender(item.box_quantity)}</td>
    <td>${formatNumber(purchasePrice)}</td>
    <td>${formatNumber(safeGet(item, "sellingPrice.value", 0))}</td>
    <td>${currency}</td>
    <td>${formatNumber(total)}</td>
  </tr>`;
      });

      content += `<tr>
    <td colspan="3"><strong>${formatNumber(prodUSD)} USD</strong></td>
    <td colspan="3"><strong>${formatNumber(prodSUM)} SUM</strong></td>
    <td colspan="3"><strong>${formatNumber(prodKGS)} KGS</strong></td>
  </tr>`;

      content += `</tbody></table>`;
    }

    content += `</body></html>`;

    const printWindow = window.open("", "_blank");
    printWindow.document.open();
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  let optiondata = partnersFromApi.map((partner) => ({
    label: partner.partner_name,
    value: partner.partner_number,
  }));

  return (
    <div className="act" style={{ padding: 20, background: "#fff" }}>
      <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
        <Space direction="vertical">
          <Button onClick={() => navigate(-1)}>
            <FaArrowLeft />
          </Button>
          <Button
            disabled={!selectedClient && !selectedPartner}
            type="primary"
            onClick={printPDF}
          >
            Chop etish
          </Button>
        </Space>

        <Space direction="vertical">
          {localStorage.getItem("role") !== "store" && (
            <Select
              showSearch
              placeholder="Hamkorni tanlang"
              style={{ width: 200 }}
              onFocus={() => setFocused("partner")}
              value={selectedPartner || undefined}
              onChange={(val) => {
                setSelectedPartner(val);
                setSelectedClient("");
              }}
              filterOption={(input, option) =>
                option.label.toLowerCase().includes(input.toLowerCase())
              }
              options={optiondata}
            />
          )}

          <Select
            showSearch
            placeholder="Mijozni tanlang"
            style={{ width: 200 }}
            onFocus={() => setFocused("client")}
            value={selectedClient || undefined}
            onChange={(val) => {
              setSelectedClient(val);
              setSelectedPartner("");
            }}
            options={clients.map((c) => ({
              value: c._id,
              label: c.name,
            }))}
            filterOption={(input, option) =>
              option.label.toLowerCase().includes(input.toLowerCase())
            }
          />
        </Space>

        <Space direction="vertical">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </Space>
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          margin: "20px 0",
          fontSize: 14,
          border: "1px solid #ccc",
        }}
      >
        <thead>
          <tr style={{ background: "#fafafa" }}>
            <th style={{ border: "1px solid #ccc", padding: 8 }}>Valyuta</th>
            <th style={{ border: "1px solid #ccc", padding: 8 }}>
              Umumiy sotuv
            </th>
            <th style={{ border: "1px solid #ccc", padding: 8 }}>
              Umumiy qarz
            </th>
            <th style={{ border: "1px solid #ccc", padding: 8 }}>Oldi-berdi</th>
            <th style={{ border: "1px solid #ccc", padding: 8 }}>
              Umumiy tovar (olish narxi)
            </th>
            <th style={{ border: "1px solid #ccc", padding: 8 }}>
              Umumiy sotilgan karobka
            </th>
          </tr>
        </thead>
        <tbody>
          {["USD", "SUM", "KGS"].map((currency, item) => (
            <tr key={currency}>
              <td style={{ border: "1px solid #ccc", padding: 8 }}>
                {currency}
              </td>
              <td style={{ border: "1px solid #ccc", padding: 8 }}>
                {summaryByCurrency[currency].sales.toLocaleString()}
              </td>
              <td style={{ border: "1px solid #ccc", padding: 8 }}>
                {summaryByCurrency[currency].debt.toLocaleString()}
              </td>
              <td style={{ border: "1px solid #ccc", padding: 8 }}>
                {summaryByCurrency[currency].balance.toLocaleString()}
              </td>
              <td style={{ border: "1px solid #ccc", padding: 8 }}>
                {summaryByCurrency[currency].products.toLocaleString()}
              </td>
              <td style={{ border: "1px solid #ccc", padding: 8 }}>
                {item === 0
                  ? (filteredSales || [])
                      .filter((a) => a.unit === "quantity")
                      .reduce((acc, sale) => acc + (sale.quantity || 0), 0)
                  : item === 1
                  ? (filteredSales || [])
                      .filter((a) => a.unit === "package_quantity")
                      .reduce((acc, sale) => acc + (sale.quantity || 0), 0)
                  : (filteredSales || [])
                      .filter((a) => a.unit === "box_quantity")
                      .reduce((acc, sale) => acc + (sale.quantity || 0), 0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedClient && (
        <>
          <Table
            dataSource={filteredSales}
            rowKey="_id"
            title={() => "Sotuvlar"}
            pagination={false}
            columns={[
              {
                title: "Mahsulot",
                dataIndex: ["productId", "name"],
                render: (text) => safeRender(text),
              },
              {
                title: "Kodi",
                dataIndex: ["productId", "code"],
                render: (text) => safeRender(text),
              },
              {
                title: "Razmeri",
                dataIndex: ["productId", "size"],
                render: (text) => safeRender(text),
              },
              {
                title: "Miqdor",
                dataIndex: "quantity",
                render: (text) => safeRender(text, "0"),
              },
              {
                title: "Birlik",
                dataIndex: "unit",
                render: (unit) => quantityText[unit] || safeRender(unit),
              },
              {
                title: "Narx",
                dataIndex: "sellingPrice",
                render: (n) => n?.toLocaleString() || "0",
              },
              {
                title: "Jami",
                render: (_, row) => (row.totalAmount || 0).toLocaleString(),
              },
            ]}
          />

          <Table
            dataSource={(filteredDebts || []).concat(
              filteredAstatkaDebts || []
            )}
            rowKey="_id"
            title={() => "Qarzlar"}
            pagination={false}
            columns={[
              {
                title: "Mahsulot",
                dataIndex: ["productId", "name"],
                render: (text) => safeRender(text),
              },
              {
                title: "Kodi",
                dataIndex: ["productId", "code"],
                render: (text) => safeRender(text),
              },
              {
                title: "Razmeri",
                dataIndex: ["productId", "size"],
                render: (text) => safeRender(text),
              },
              {
                title: "Miqdor",
                dataIndex: "quantity",
                render: (text) => safeRender(text, "0"),
              },
              {
                title: "Birlik",
                dataIndex: "unit",
                render: (unit) => quantityText[unit] || safeRender(unit),
              },
              {
                title: "Narx",
                dataIndex: "sellingPrice",
                render: (text) => text?.toLocaleString() || "0",
              },
              {
                title: "Valyuta",
                dataIndex: "currency",
                render: (text) => safeRender(text, "USD"),
              },
              {
                title: "Jami",
                dataIndex: "totalAmount",
                render: (text) => text?.toLocaleString() || "0",
              },
              {
                title: "Qolgan",
                dataIndex: "remainingAmount",
                render: (text) => text?.toLocaleString() || "0",
              },
            ]}
            style={{ marginTop: 20 }}
          />
          <Table
            dataSource={filteredAstatkaPayments}
            rowKey="_id"
            title={() => "To'lovlar"}
            pagination={false}
            columns={[
              {
                title: "Summa",
                dataIndex: "amount",
                render: (text) => text?.toLocaleString() || "0",
              },
              {
                title: "Valyuta",
                dataIndex: "currency",
                render: (text) => safeRender(text, "USD"),
              },
              {
                title: "Sana",
                dataIndex: "createdAt",
                render: (text) =>
                  text ? moment(text).format("DD.MM.YYYY") : "Не указан",
              },
            ]}
            style={{ marginTop: 20 }}
          />
        </>
      )}

      {selectedPartner && (
        <>
          <Table
            dataSource={filteredSales}
            rowKey="_id"
            title={() => "Sotuvlar"}
            pagination={false}
            columns={[
              {
                title: "Mahsulot",
                dataIndex: ["productId", "name"],
                render: (text) => safeRender(text),
              },
              {
                title: "Kodi",
                dataIndex: ["productId", "code"],
                render: (text) => safeRender(text),
              },
              {
                title: "Razmeri",
                dataIndex: ["productId", "size"],
                render: (text) => safeRender(text),
              },
              {
                title: "Miqdor",
                dataIndex: "quantity",
                render: (text) => safeRender(text, "0"),
              },
              {
                title: "Birlik",
                dataIndex: "unit",
                render: (unit) => quantityText[unit] || safeRender(unit),
              },
              {
                title: "Narx",
                dataIndex: "sellingPrice",
                render: (text) => text?.toLocaleString() || "0",
              },
              {
                title: "Jami",
                render: (_, row) =>
                  (
                    (row.quantity || 0) * (row.sellingPrice || 0)
                  ).toLocaleString(),
              },
            ]}
          />

          <Table
            dataSource={(filteredDebts || []).concat(
              filteredAstatkaDebts || []
            )}
            rowKey="_id"
            title={() => "Qarzlar"}
            pagination={false}
            columns={[
              {
                title: "Mahsulot",
                dataIndex: ["productId", "name"],
                render: (text) => safeRender(text),
              },
              {
                title: "Kodi",
                dataIndex: ["productId", "code"],
                render: (text) => safeRender(text),
              },
              {
                title: "Razmeri",
                dataIndex: ["productId", "size"],
                render: (text) => safeRender(text),
              },
              {
                title: "Miqdor",
                dataIndex: "quantity",
                render: (text) => safeRender(text, "0"),
              },
              {
                title: "Birlik",
                dataIndex: "unit",
                render: (unit) => quantityText[unit] || safeRender(unit),
              },
              {
                title: "Narx",
                dataIndex: "sellingPrice",
                render: (text) => text?.toLocaleString() || "0",
              },
              {
                title: "Valyuta",
                dataIndex: "currency",
                render: (text) => safeRender(text, "USD"),
              },
              {
                title: "Jami",
                dataIndex: "totalAmount",
                render: (text) => text?.toLocaleString() || "0",
              },
              {
                title: "Qolgan",
                dataIndex: "remainingAmount",
                render: (text) => text?.toLocaleString() || "0",
              },
            ]}
            style={{ marginTop: 20 }}
          />
          <Table
            dataSource={(filteredAstatkaPayments || []).concat(
              productReport || []
            )}
            rowKey="_id"
            title={() => "To'lovlar"}
            pagination={false}
            columns={[
              {
                title: "Summa",
                dataIndex: "amount",
                render: (text) => text?.toLocaleString() || "0",
              },
              {
                title: "Valyuta",
                dataIndex: "currency",
                render: (text) => safeRender(text, "USD"),
              },
              {
                title: "Sana",
                dataIndex: "createdAt",
                render: (text) =>
                  text ? moment(text).format("DD.MM.YYYY") : "Не указан",
              },
            ]}
            style={{ marginTop: 20 }}
          />

          <Table
            dataSource={filteredPartnerProducts}
            rowKey="_id"
            title={() => "Hamkor tovarlari"}
            pagination={false}
            columns={[
              {
                title: "Mahsulot",
                dataIndex: "name",
                render: (text) => safeRender(text),
              },
              {
                title: "Kodi",
                dataIndex: "code",
                render: (text) => safeRender(text),
              },
              {
                title: "Hajmi",
                dataIndex: "size",
                render: (text) => safeRender(text),
              },
              {
                title: "Miqdor",
                dataIndex: "quantity",
                render: (text) => safeRender(text, "0"),
              },
              {
                title: "Paket",
                dataIndex: "package_quantity",
                render: (text) => safeRender(text),
              },
              {
                title: "Quti",
                dataIndex: "box_quantity",
                render: (text) => safeRender(text),
              },
              {
                title: "Olish narxi",
                dataIndex: ["purchasePrice", "value"],
                render: (text) => text?.toLocaleString() || "0",
              },
              {
                title: "Sotish narxi",
                dataIndex: ["sellingPrice", "value"],
                render: (text) => text?.toLocaleString() || "0",
              },
              {
                title: "Valyuta",
                dataIndex: "currency",
                render: (text) => safeRender(text, "USD"),
              },
              {
                title: "Jami",
                render: (_, row) =>
                  (
                    (row.quantity || 0) * (row.sellingPrice?.value || 0)
                  ).toLocaleString(),
              },
            ]}
            style={{ marginTop: 20 }}
          />
        </>
      )}
    </div>
  );
};

export default ReconciliationAct;
