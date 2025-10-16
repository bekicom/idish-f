import { useState, useMemo } from "react";
import { Select, Input, Button, Space } from "antd";
import { useGetClientsQuery } from "../../context/service/client.service";
import { useGetAllDebtorsQuery } from "../../context/service/debt.service";
import { useGetProductsPartnerQuery } from "../../context/service/partner.service";
import { useGetSalesHistoryQuery } from "../../context/service/sales.service";
import { useGetActPartnersQuery } from "../../context/service/act-partner.service";
import { FaArrowLeft } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { useGetAllReportsQuery } from "../../context/service/report.service";

// 🔹 Valyuta bo‘yicha umumiy jadval
const CurrencySummaryTable = ({ summaryByCurrency, filteredSales }) => (
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
        <th style={{ border: "1px solid #ccc", padding: 8 }}>Umumiy sotuv</th>
        <th style={{ border: "1px solid #ccc", padding: 8 }}>Umumiy qarz</th>
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
          <td style={{ border: "1px solid #ccc", padding: 8 }}>{currency}</td>
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
              ? filteredSales
                  ?.filter((a) => a.unit === "quantity")
                  .reduce((acc, sale) => acc + sale.quantity, 0)
              : item === 1
              ? filteredSales
                  ?.filter((a) => a.unit === "package_quantity")
                  .reduce((acc, sale) => acc + sale.quantity, 0)
              : filteredSales
                  ?.filter((a) => a.unit === "box_quantity")
                  .reduce((acc, sale) => acc + sale.quantity, 0)}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

// 🔹 Sotuvlar jadvali
const SalesTable = ({ data, quantityText }) => (
  <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 20 }}>
    <thead>
      <tr>
        <th>Mahsulot</th>
        <th>Kodi</th>
        <th>Razmeri</th>
        <th>Miqdor</th>
        <th>Birlik</th>
        <th>Narx</th>
        <th>Jami</th>
      </tr>
    </thead>
    <tbody>
      {data.map((row) => (
        <tr key={row._id}>
          <td>{row.productId?.name}</td>
          <td>{row.productId?.code}</td>
          <td>{row.productId?.size}</td>
          <td>{row.quantity}</td>
          <td>{quantityText[row.unit] || row.unit}</td>
          <td>{row.sellingPrice?.toLocaleString()}</td>
          <td>{row.totalAmount?.toLocaleString()}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

// 🔹 Qarzdorlik jadvali
const DebtsTable = ({ data, quantityText }) => (
  <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 20 }}>
    <thead>
      <tr>
        <th>Mahsulot</th>
        <th>Kodi</th>
        <th>Razmeri</th>
        <th>Miqdor</th>
        <th>Birlik</th>
        <th>Narx</th>
        <th>Valyuta</th>
        <th>Jami</th>
        <th>Qolgan</th>
      </tr>
    </thead>
    <tbody>
      {data.map((row) => (
        <tr key={row._id}>
          <td>{row.productId?.name}</td>
          <td>{row.productId?.code}</td>
          <td>{row.productId?.size}</td>
          <td>{row.quantity}</td>
          <td>{quantityText[row.unit] || row.unit}</td>
          <td>{row.sellingPrice?.toLocaleString()}</td>
          <td>{row.currency}</td>
          <td>{row.totalAmount?.toLocaleString()}</td>
          <td>{row.remainingAmount?.toLocaleString()}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

// 🔹 To‘lovlar jadvali
const PaymentsTable = ({ data }) => (
  <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 20 }}>
    <thead>
      <tr>
        <th>Summa</th>
        <th>Valyuta</th> 
        <th>Sana</th>
      </tr>
    </thead>
    <tbody>
      {data.map((row) => (
        <tr key={row._id}>
          <td>{row.amount?.toLocaleString()}</td>
          <td>{row.currency}</td>
          <td>{moment(row.createdAt).format("DD.MM.YYYY")}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const ReconciliationAct = () => {
  const { data: partnerProducts = [] } = useGetProductsPartnerQuery();
  const { data: sales = [] } = useGetSalesHistoryQuery();
  const { data: debts = [] } = useGetAllDebtorsQuery();
  const { data: reports = [] } = useGetAllReportsQuery();
  const { data: clients = [] } = useGetClientsQuery();
  const { data: partnersFromApi = [] } = useGetActPartnersQuery();
  const navigate = useNavigate();

  const [selectedPartner, setSelectedPartner] = useState("");
  const [selectedClient, setSelectedClient] = useState("");

  // 🔹 quantity mapping
  const quantityText = {
    quantity: "Dona",
    package_quantity: "Pachka",
    box_quantity: "Karobka",
  };

  // 🔹 umumiy hisob-kitob
  const summaryByCurrency = useMemo(() => {
    const result = {
      USD: { sales: 0, balance: 0, debt: 0, products: 0 },
      SUM: { sales: 0, balance: 0, debt: 0, products: 0 },
      KGS: { sales: 0, balance: 0, debt: 0, products: 0 },
    };
    sales.forEach((s) => {
      if (result[s.currency]) {
        result[s.currency].sales += s.sellingPrice * s.quantity;
      }
    });
    debts.forEach((d) => {
      if (result[d.currency]) {
        result[d.currency].debt += d.remainingAmount;
      }
    });
    return result;
  }, [sales, debts]);

  return (
    <div className="act" style={{ padding: 20, background: "#fff" }}>
      <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
        <Space direction="vertical">
          <Button onClick={() => navigate(-1)}>
            <FaArrowLeft />
          </Button>
        </Space>

        <Space direction="vertical">
          <Select
            showSearch
            placeholder="Hamkorni tanlang"
            style={{ width: 200 }}
            value={selectedPartner || undefined}
            onChange={(val) => {
              setSelectedPartner(val);
              setSelectedClient("");
            }}
            options={partnersFromApi.map((p) => ({
              value: p.partner_number,
              label: p.partner_name,
            }))}
          />
          <Select
            showSearch
            placeholder="Mijozni tanlang"
            style={{ width: 200 }}
            value={selectedClient || undefined}
            onChange={(val) => {
              setSelectedClient(val);
              setSelectedPartner("");
            }}
            options={clients.map((c) => ({
              value: c._id,
              label: c.name,
            }))}
          />
        </Space>
      </div>

      {/* umumiy valyuta */}
      <CurrencySummaryTable
        summaryByCurrency={summaryByCurrency}
        filteredSales={sales}
      />

      {selectedClient && (
        <>
          <SalesTable data={sales} quantityText={quantityText} />
          <DebtsTable data={debts} quantityText={quantityText} />
          <PaymentsTable
            data={reports.filter((r) => r.clientId === selectedClient)}
          />
        </>
      )}

      {selectedPartner && (
        <>
          <SalesTable data={sales} quantityText={quantityText} />
          <DebtsTable data={debts} quantityText={quantityText} />
          <PaymentsTable
            data={reports.filter((r) => r.partnerId === selectedPartner)}
          />
        </>
      )}
    </div>
  );
};

export default ReconciliationAct;
