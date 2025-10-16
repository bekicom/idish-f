import React, { useMemo } from "react";
import { Card, Space, Divider } from "antd";
import { useGetWarehousesQuery } from "../../context/service/ombor.service";
import { useGetProductsByWarehouseQuery } from "../../context/service/product.service";
import { useGetUsdRateQuery } from "../../context/service/usd.service";
import { useGetSalesHistoryQuery } from "../../context/service/sotuv.service";
import { useGetAllDebtorsQuery } from "../../context/service/debt.service";
import { useGetProductsQuery } from "../../context/service/product.service";
import { useGetExpensesQuery } from "../../context/service/expense.service";
import {
  DollarOutlined,
  ShoppingCartOutlined,
  CreditCardOutlined,
  CalendarOutlined,
  RiseOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import "./investment.css";
import { useGetAllReportsQuery } from "../../context/service/report.service";
import { useGetProductsPartnerQuery } from "../../context/service/partner.service";

import moment from "moment";

const cardGradients = [
  "linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)",
  "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
  "linear-gradient(135deg, #f3e7e9 0%, #e3eeff 100%)",
  "linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)",
  "linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)",
];

// Utility funksiyasi: real miqdorni hisoblash
const calculateRealQuantity = (sale, product) => {
  if (!product) return sale.quantity;

  const {
    quantity_per_package = 1,
    package_quantity_per_box = 1,
    isPackage,
  } = product;
  let realQuantity = sale.quantity;

  if (isPackage) {
    if (sale.unit === "package") {
      realQuantity *= quantity_per_package;
    } else if (sale.unit === "box") {
      realQuantity *= quantity_per_package * package_quantity_per_box;
    }
  } else {
    if (sale.unit === "box") {
      realQuantity *= package_quantity_per_box;
    }
  }

  return realQuantity;
};

// Utility funksiyasi: USD ga konvertatsiya
const convertToUSD = (amount, currency, usdRate, kgsRate) => {
  if (currency === "USD") return amount;
  if (currency === "SUM") return amount / usdRate;
  if (currency === "KGS") return amount / kgsRate;
  return amount;
};
const WarehouseCard = ({ ombor, usdRate, kgsRate, sales, products, index }) => {
  const { data: mahsulotlar = [] } = useGetProductsByWarehouseQuery(ombor?._id);

  const calculateStats = useMemo(() => {
    const warehouseSales = (sales || []).filter(
      (sale) => sale?.productId?.warehouse?._id === ombor?._id
    );

    const totalQuantity = mahsulotlar.reduce(
      (sum, p) => sum + (Number(p.box_quantity) || 0),
      0
    );

    const totalKg = mahsulotlar.reduce((sum, p) => sum + (p.total_kg || 0), 0);

    const totalPurchase = mahsulotlar.reduce(
      (sum, p) => sum + (p.quantity || 0) * (p.purchasePrice?.value || 0),
      0
    );

    const totalSale = mahsulotlar.reduce(
      (sum, p) => sum + (p.quantity || 0) * (p.sellingPrice?.value || 0),
      0
    );

    // Haqiqiy foyda hisoblash
    let totalProfit = 0;
    warehouseSales.forEach((sale) => {
      const product = (products || []).find(
        (p) => p._id === sale.productId?._id
      );
      if (!product) return;

      const realQuantity = calculateRealQuantity(sale, product);
      const sellingPriceUSD = convertToUSD(
        sale.sellingPrice,
        sale.currency,
        usdRate,
        kgsRate
      );
      const purchasePrice = product.purchasePrice?.value || 0;

      totalProfit += (sellingPriceUSD - purchasePrice) * realQuantity;
    });

    const latestDate =
      mahsulotlar.length > 0
        ? new Date(
            Math.max(
              ...mahsulotlar.map((p) => new Date(p.createdAt || Date.now()))
            )
          ).toLocaleDateString()
        : new Date().toLocaleDateString();

    return {
      totalQuantity,
      totalKg,
      totalPurchase,
      totalSale,
      totalProfit,
      latestDate,
      hasProducts: mahsulotlar.length > 0 || warehouseSales.length > 0,
    };
  }, [mahsulotlar, sales, ombor?._id, products, usdRate, kgsRate]);

  const cardStyle = {
    background: cardGradients[index % cardGradients.length],
    border: "none",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
  };

  return (
    <Card
      key={ombor?._id}
      title={ombor.name}
      className="invest-warehouse-card"
      style={cardStyle}
      headStyle={{ borderBottom: "none" }}
    >
      <p className="invest-warehouse-address">
        <HomeOutlined /> {ombor.address}
      </p>
      {calculateStats.hasProducts ? (
        <div className="invest-warehouse-stats">
          <div className="invest-stat-item">
            <p>
              <strong>
                <CalendarOutlined /> Sana:
              </strong>{" "}
              <span className="invest-date">{calculateStats.latestDate}</span>
            </p>
          </div>
          <Divider style={{ margin: "10px 0", borderColor: "#e8e8e8" }} />
          <div className="invest-stat-item">
            <p>
              <strong>
                <ShoppingCartOutlined /> Jami (mavjud):
              </strong>{" "}
              <span className="invest-quantity">
                {calculateStats.totalQuantity.toLocaleString()} karobka
              </span>
            </p>
          </div>
          <div className="invest-stat-item">
            <p>
              <strong>
                <ShoppingCartOutlined /> Jami (mavjud):
              </strong>{" "}
              <span className="invest-quantity">
                {calculateStats.totalKg.toFixed(2)} kg
              </span>
            </p>
          </div>
          <div className="invest-stat-item">
            <p>
              <strong>
                <ShoppingCartOutlined /> Jami tan narx:
              </strong>{" "}
              <span className="invest-quantity">
                {calculateStats.totalPurchase.toFixed(2)} USD
              </span>
            </p>
          </div>
          <div className="invest-stat-item">
            <p>
              <strong>
                <ShoppingCartOutlined /> Jami sotish narx:
              </strong>{" "}
              <span className="invest-quantity">
                {calculateStats.totalSale.toFixed(2)} USD
              </span>
            </p>
          </div>
          <div className="invest-stat-item">
            <p>
              <strong>
                <ShoppingCartOutlined /> Jami foyda:
              </strong>{" "}
              <span className="invest-quantity">
                {calculateStats.totalProfit.toFixed(2)} USD
              </span>
            </p>
          </div>
        </div>
      ) : (
        <p className="invest-no-data">Bu omborda mahsulotlar yo'q.</p>
      )}
    </Card>
  );
};

const SummaryCard = ({
  expenses,
  debtors,
  products,
  sales,
  usdRate,
  kgsRate,
}) => {
  const { data: reports = [] } = useGetAllReportsQuery();
  const { data: partnerProducts = [] } = useGetProductsPartnerQuery();

  const summaryStats = useMemo(() => {
    const currentMonth = moment().month();
    const currentYear = moment().year();

    // Xarajatlar
    const totalExpensesUZS = (expenses || []).reduce(
      (total, item) => total + (Number(item?.amount) || 0),
      0
    );
    const monthlyExpensesUZS = (expenses || [])
      .filter(
        (item) =>
          moment(item.date).month() === currentMonth &&
          moment(item.date).year() === currentYear
      )
      .reduce((total, item) => total + (Number(item?.amount) || 0), 0);

    const totalDebtUSD = (debtors || []).reduce((total, debt) => {
      // Har bir qarzdorlik ichidagi USD mahsulotlarni yig'amiz
      const usdProducts = (debt.products || []).filter(
        (p) => p.currency === "USD"
      );
      const usdDebt = usdProducts.reduce(
        (sum, p) => sum + (p.totalAmount || 0),
        0
      );

      // Qoldiqni hisobga olamiz (agar to'lov qisman bo'lsa)
      const remaining = debt.remainingAmount || usdDebt;

      return total + remaining;
    }, 0);

    const totalDebtUZS = totalDebtUSD * usdRate; // USD → SO'M

    // Astatka qarzlari
    const allAstatkaQarzUzs = (reports || [])
      .filter((item) => item.currency === "SUM" && item.type === "debt")
      .reduce((acc, item) => acc + (item?.amount || 0), 0);

    const allAstatkaQarzUsd = (reports || [])
      .filter((item) => item.currency === "USD" && item.type === "debt")
      .reduce((acc, item) => acc + (item?.amount || 0), 0);

    // Astatka to'lovlari
    const allAstatkaHaqUzs = (reports || [])
      .filter((item) => item.currency === "SUM" && item.type === "payment")
      .reduce((acc, item) => acc + (item?.amount || 0), 0);

    const allAstatkaHaqUsd = (reports || [])
      .filter((item) => item.currency === "USD" && item.type === "payment")
      .reduce((acc, item) => acc + (item?.amount || 0), 0);

    // Hamkorlardan qarz (partnerProducts dan hisoblaymiz)
    const partnerDebt = (partnerProducts || []).reduce((sum, product) => {
      return sum + (product.remaining_debt || 0);
    }, 0);

    // Mahsulotlar
    const totalPurchaseUSD = (products || []).reduce((total, item) => {
      const quantity = Number(item.quantity) || 0;
      const purchaseValue = Number(item.purchasePrice?.value) || 0;
      return total + purchaseValue * quantity;
    }, 0);

    const totalProductBox = (products || []).reduce(
      (total, item) => total + (item.warehouse ? item.box_quantity : 0),
      0
    );

    // Sof foyda hisoblash
    let totalProfit = 0;
    (sales || []).forEach((sale) => {
      const product = (products || []).find(
        (p) => p._id === sale.productId?._id
      );
      if (!product) return;

      const realQuantity = calculateRealQuantity(sale, product);
      const sellingPriceUSD = convertToUSD(
        sale.sellingPrice,
        sale.currency,
        usdRate,
        kgsRate
      );
      const purchasePrice = product.purchasePrice?.value || 0;

      totalProfit += (sellingPriceUSD - purchasePrice) * realQuantity;
    });

    const totalExpensesUSD = totalExpensesUZS / usdRate;
    const netProfit = totalProfit - totalExpensesUSD;

    return {
      totalExpensesUZS,
      monthlyExpensesUZS,
      totalDebtUZS,
      totalDebtUSD,
      allAstatkaQarzUzs,
      allAstatkaQarzUsd,
      allAstatkaHaqUzs,
      allAstatkaHaqUsd,
      partnerDebt,
      totalPurchaseUSD,
      totalProductBox,
      netProfit,
    };
  }, [
    expenses,
    debtors,
    reports,
    partnerProducts,
    products,
    sales,
    usdRate,
    kgsRate,
  ]);

  return (
    <Card
      title="Umumiy statistika"
      className="invest-summary-card"
      headStyle={{ borderBottom: "none" }}
    >
      <div className="invest-warehouse-stats">
        <div
          className="invest-stat-item"
          style={{ display: "flex", justifyContent: "space-between" }}
        >
          <div>
            <p>
              <strong>Umumiy xarajat:</strong>
            </p>
            <p>
              <span className="invest-purchase">
                {summaryStats.totalExpensesUZS.toLocaleString("uz-UZ", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                so'm
              </span>
            </p>
          </div>
          <div>
            <p>
              <strong>Oylik xarajat:</strong>
            </p>
            <p>
              <span className="invest-purchase">
                {summaryStats.monthlyExpensesUZS.toLocaleString("uz-UZ", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                so'm
              </span>
            </p>
          </div>
        </div>
        <Divider
          style={{ margin: "10px 0", borderColor: "rgba(255, 255, 255, 0.2)" }}
        />

        <div className="invest-stat-item">
          <div>
            <p>
              <strong>Umumiy nasiya (qarzdorlik):</strong>
            </p>
            <Space>
              <p>
                <span className="invest-debt">
                  {summaryStats.totalDebtUZS.toLocaleString("uz-UZ", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  so'm
                </span>
              </p>
              <p>
                <span className="invest-debt">
                  {summaryStats.totalDebtUSD.toFixed(2)} $
                </span>
              </p>
            </Space>
          </div>
          <div>
            <p>
              <strong>Umumiy ast. qarz:</strong>
            </p>
            <Space>
              <p>
                <span className="invest-debt">
                  {summaryStats.allAstatkaQarzUzs.toLocaleString("uz-UZ", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  so'm
                </span>
              </p>
              <p>
                <span className="invest-debt">
                  {summaryStats.allAstatkaQarzUsd.toFixed(2)} $
                </span>
              </p>
            </Space>
          </div>
          <div>
            <p>
              <strong>Jami qarzlar:</strong>
            </p>
            <Space>
              <p>
                <span className="invest-debt">
                  {(
                    summaryStats.allAstatkaQarzUzs + summaryStats.totalDebtUZS
                  ).toLocaleString("uz-UZ", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  so'm
                </span>
              </p>
              <p>
                <span className="invest-debt">
                  {(
                    summaryStats.allAstatkaQarzUsd + summaryStats.totalDebtUSD
                  ).toFixed(2)}{" "}
                  $
                </span>
              </p>
            </Space>
          </div>
        </div>
        <Divider
          style={{ margin: "10px 0", borderColor: "rgba(255, 255, 255, 0.2)" }}
        />

        <div className="invest-stat-item">
          <p>
            <strong>Umumiy astatka haq (UZS):</strong>
            <p>
              <span>{summaryStats.allAstatkaHaqUzs.toLocaleString()}</span>
            </p>
          </p>
          <p>
            <strong>Umumiy astatka haq (USD):</strong>
            <p>
              <span>{summaryStats.allAstatkaHaqUsd.toFixed(2)}</span>
            </p>
          </p>
        </div>
        <Divider
          style={{ margin: "10px 0", borderColor: "rgba(255, 255, 255, 0.2)" }}
        />

        <div className="invest-stat-item">
          <p>
            <strong>Hamkorlardan qarz (tovar):</strong>
          </p>
          <p>
            <span className="invest-purchase">
              {summaryStats.partnerDebt.toFixed(2)} $
            </span>
          </p>
        </div>
        <Divider
          style={{ margin: "10px 0", borderColor: "rgba(255, 255, 255, 0.2)" }}
        />

        <div className="invest-stat-item">
          <p>
            <strong>
              <ShoppingCartOutlined /> Umumiy mahsulotlar:
            </strong>
          </p>
          <p>
            <span className="invest-purchase">
              {summaryStats.totalPurchaseUSD.toFixed(2)} $
            </span>
          </p>
          <p>
            <span className="invest-purchase">
              {summaryStats.totalProductBox.toFixed(2)} karobka
            </span>
          </p>
        </div>
        <Divider
          style={{ margin: "10px 0", borderColor: "rgba(255, 255, 255, 0.2)" }}
        />

        <div className="invest-stat-item">
          <p>
            <strong>
              <RiseOutlined /> Sof daromad:
            </strong>
          </p>
          <p>
            <span className="invest-profit">
              {summaryStats.netProfit.toFixed(2)} $
            </span>
          </p>
        </div>
      </div>
    </Card>
  );
};

export default function Investitsiya() {
  const { data: omborlar = [] } = useGetWarehousesQuery();
  const { data: usdRateData, isLoading: usdLoading } = useGetUsdRateQuery();
  const { data: sales = [], isLoading: salesLoading } =
    useGetSalesHistoryQuery();
  const { data: products = [], isLoading: productsLoading } =
    useGetProductsQuery();
  const { data: debtors = [], isLoading: debtorsLoading } =
    useGetAllDebtorsQuery();
  const { data: expenses = [], isLoading: expensesLoading } =
    useGetExpensesQuery();

  const usdRate = usdRateData?.rate || 12960;
  const kgsRate = usdRateData?.kgs || 150;

  if (
    usdLoading ||
    salesLoading ||
    debtorsLoading ||
    productsLoading ||
    expensesLoading
  ) {
    return <div className="invest-loading">Yuklanmoqda...</div>;
  }

  return (
    <div className="invest-container">
      <div className="invest-warehouse-cards">
        <SummaryCard
          expenses={expenses}
          debtors={debtors}
          products={products}
          sales={sales}
          usdRate={usdRate}
          kgsRate={kgsRate}
        />
        {omborlar.map((ombor, index) => (
          <WarehouseCard
            key={ombor?._id}
            ombor={ombor}
            usdRate={usdRate}
            kgsRate={kgsRate}
            sales={sales}
            products={products}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
