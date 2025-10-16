import React, { useState, useEffect } from "react";
import {
  Layout,
  Menu,
  Button,
  Modal,
  Card,
  Table,
  Badge,
  Checkbox,
} from "antd";
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  UserOutlined,
  HomeOutlined,
  AppstoreOutlined,
  ShoppingOutlined,
  DollarOutlined,
  TeamOutlined,
  CreditCardOutlined,
  BarChartOutlined,
  ExclamationCircleOutlined,
  MoneyCollectOutlined,
  ScheduleOutlined,
  UserSwitchOutlined,
  UserAddOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { FaChartLine, FaClipboardQuestion, FaList } from "react-icons/fa6";

import { LuTicketPercent } from "react-icons/lu";

// Asosiy sahifa komponentlari
import Admin from "../Adminlar/Adminlar";
import Ombor from "../Ombor/Ombor";
import Product from "../Product/Product";
import Kassa from "../Kassa/Kassa";
import Client from "../Client/Client";
import Debtors from "../Debt/Debtors";
import Sales from "../Sotuv-tarix/Sotuv";
import Brak from "../Brak/Brak";
import Expense from "../Rasxod/Expense";
import Promo from "../promo/Promo";
import Statistika from "../statistika/statistika";
import Investitsiya from "../investment/Investitsiya";
import Partner from "../partner/Partner";
import ReconciliationAct from "../reconciliation-act/ReconciliationAct";
import ReportAdd from "../report-add/ReportAdd";

// Yangi qo‘shilgan bo‘limlar
import Hodimlar from "../hodimlar/Hodimlar";
import OylikXisobot from "../Oylik/Oylik";
import Stores from "../Stores/Stores";
import Transportion from "../transportion/Transportion";
import { IoIosNotifications } from "react-icons/io";
import Daily from "../Daily/Daily";
import { useAddUnfinishedMutation } from "../../context/service/unfinished.service";
import Unfinished from "../unfinished/Unfinished";
import PartnerDebts from "../PartnerDebts/PartnerDebts";
import { DollarCircleOutlined } from "@ant-design/icons";

const { Header, Sider, Content } = Layout;

export default function Home() {
  const [collapsed, setCollapsed] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [products, setProducts] = useState([]);
  const success = JSON.parse(localStorage.getItem("acsess") || "{}");
  const [addUnfinished] = useAddUnfinishedMutation();

  useEffect(() => {
    let sendedData = JSON.parse(localStorage.getItem("newSales")) || [];
    if (sendedData.length > 0) {
      setProducts(sendedData);
    }
  }, [products]);

  const handleCheckboxChange = (index, record, e) => {
    let item = products.find((item, inx) => inx === index);

    item.products = item.products.map((product) => {
      if (product.id === record.id) {
        product.checked = e.target.checked;
      }
      return product;
    });
    let newData = products.map((i, order) => {
      if (order === index) {
        i = item;
      }
      return i;
    });

    setProducts(newData);

    localStorage.setItem("newSales", JSON.stringify(newData));
  };

  const role = localStorage.getItem("role");
  const [selectedPage, setSelectedPage] = useState(
    role === "admin" ? "home" : "product"
  );

  const toggle = () => setCollapsed(!collapsed);
  const stm = {
    kg_quantity: "kg",
    quantity: "dona",
    box_quantity: "karobka",
    package_quantity: "pachka",
  };
  const renderContent = () => {
    switch (selectedPage) {
      case "admin":
        return <Admin />;
      case "daily":
        return <Daily />;
      case "statistika":
        return <Statistika />;
      case "ombor":
        return <Ombor />;
      case "product":
        return <Product />;
      case "partner":
        return <Partner />;
      case "kassa":
        return <Kassa />;
      case "client":
        return <Client />;
      case "debtors":
        return <Debtors />;
      case "promo":
        return <Promo />;
      case "sales":
        return <Sales />;
      case "brak":
        return <Brak />;
      case "expense":
        return <Expense />;
      case "report":
        return <ReconciliationAct />;
      case "report-add":
        return <ReportAdd />;
      case "hodimlar":
        return <Hodimlar />;
      case "oylik":
        return <OylikXisobot />;
      case "stores":
        return <Stores />;
      case "transportions":
        return <Transportion />;
      case "unfinished":
        return <Unfinished />;
        case "partner-debts":
          return <PartnerDebts />;
      case "home":

      default:
        return <Investitsiya />;
    }
  };

  // ...existing code...
  const handlePrint = (item) => {
    // Jadval HTMLini yaratish
    const tableHtml = `
    <html>
      <head>
        <title>Chop etish</title>
        <style>
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #333; padding: 8px; text-align: left; }
        </style>
      </head>
      <body>
        <h2>Yuboruvchi: ${item.sender.name}</h2>
        <table>
          <thead>
            <tr>
              <th>Mahsulot nomi</th>
              <th>Birlik</th>
              <th>Soni</th>
            </tr>
          </thead>
          <tbody>
            ${item.products
              .map(
                (prod) => `
                  <tr>
                    <td>${prod.productId.name}</td>
                    <td>${stm[prod.unit] || prod.unit}</td>
                    <td>${prod.quantity}</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </body>
    </html>
  `;
    // Yangi oynada ochib, chop etish
    const printWindow = window.open("", "_blank");
    printWindow.document.write(tableHtml);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };
  // ...existing code...

  const removeItem = async (item) => {
    // checkProducts
    try {
      let data = products.find((el) => el.sender._id === item.sender._id);
      let state = data.products.every((el) => el.checked === true);

      if (state !== true) {
        let body = {
          senderId: data.sender._id,
          senderName: data.sender.name,
          products: data.products.map((i) => ({
            productId: i.productId._id,
            quantity: i.quantity,
            unit: i.unit,
            name: i.productId.name,
            checked: i.checked,
          })),
        };
        await addUnfinished(body);
      }
    } catch (error) {
      console.log(error);
    }

    const newArr = products.filter((el) => el.sender._id !== item.sender._id);
    localStorage.setItem("newSales", JSON.stringify(newArr));
    setOpenModal(false);
    setTimeout(() => setOpenModal(true), 0);
  };

  return (
    <Layout style={{ maxHeight: "calc(100vh - 50px)", overflow: "hidden" }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="logo" />
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={role === "admin" ? ["home"] : ["product"]}
          selectedKeys={[selectedPage]}
          onClick={(e) => setSelectedPage(e.key)}
        >
          {success?.home && (
            <Menu.Item
              style={{ height: "35px" }}
              key="home"
              icon={<HomeOutlined />}
            >
              Домашняя страница
            </Menu.Item>
          )}
          {success?.daily && (
            <Menu.Item style={{ height: "35px" }} key="daily" icon={<FaList />}>
              Ежедневный отчет
            </Menu.Item>
          )}
          {success?.statistika && (
            <Menu.Item
              style={{ height: "35px" }}
              key="statistika"
              icon={<FaChartLine />}
            >
              Статистика
            </Menu.Item>
          )}
          {success?.admin && (
            <Menu.Item
              style={{ height: "35px" }}
              key="admin"
              icon={<UserOutlined />}
            >
              Админы
            </Menu.Item>
          )}
          {success?.ombor && (
            <Menu.Item
              style={{ height: "35px" }}
              key="ombor"
              icon={<AppstoreOutlined />}
            >
              Склады
            </Menu.Item>
          )}
          {success?.stores && (
            <Menu.Item
              style={{ height: "35px" }}
              key="stores"
              icon={<AppstoreOutlined />}
            >
              Магазины
            </Menu.Item>
          )}
          {(success?.product || role === "warehouse") && (
            <Menu.Item
              style={{ height: "35px" }}
              key="product"
              icon={<ShoppingOutlined />}
            >
              Продукты
            </Menu.Item>
          )}
          {success?.partner && (
            <Menu.Item
              style={{ height: "35px" }}
              key="partner"
              icon={<UserSwitchOutlined />}
            >
              Поставщики
            </Menu.Item>
          )}
          {success?.client && (
            <Menu.Item
              style={{ height: "35px" }}
              key="client"
              icon={<TeamOutlined />}
            >
              Покупатели
            </Menu.Item>
          )}
          {success?.debtors && (
            <Menu.Item
              style={{ height: "35px" }}
              key="debtors"
              icon={<CreditCardOutlined />}
            >
              Должники
            </Menu.Item>
          )}
          {(success?.partner || role === "admin") && (
            <Menu.Item
              style={{ height: "35px" }}
              key="partner-debts"
              icon={<DollarCircleOutlined />}
            >
              Долг поставщикам
            </Menu.Item>
          )}

          {success?.promo && (
            <Menu.Item
              style={{ height: "35px" }}
              key="promo"
              icon={<LuTicketPercent />}
            >
              Промокоды
            </Menu.Item>
          )}
          {success?.sales && (
            <Menu.Item
              style={{ height: "35px" }}
              key="sales"
              icon={<BarChartOutlined />}
            >
              Проданные товары
            </Menu.Item>
          )}
          {success?.brak && (
            <Menu.Item
              style={{ height: "35px" }}
              key="brak"
              icon={<ExclamationCircleOutlined />}
            >
              Брак
            </Menu.Item>
          )}
          {success?.expense && (
            <Menu.Item
              style={{ height: "35px" }}
              key="expense"
              icon={<MoneyCollectOutlined />}
            >
              Расходы
            </Menu.Item>
          )}
          {success?.report && (
            <Menu.Item
              style={{ height: "35px" }}
              key="report"
              icon={<ScheduleOutlined />}
            >
              Акт сверка
            </Menu.Item>
          )}
          {success?.["report-add"] && (
            <Menu.Item
              style={{ height: "35px" }}
              key="report-add"
              icon={<UserAddOutlined />}
            >
              Добавить остаток
            </Menu.Item>
          )}
          {success?.hodimlar && (
            <Menu.Item
              style={{ height: "35px" }}
              key="hodimlar"
              icon={<TeamOutlined />}
            >
              Сотрудники
            </Menu.Item>
          )}
          {success?.oylik && (
            <Menu.Item
              style={{ height: "35px" }}
              key="oylik"
              icon={<DollarOutlined />}
            >
              Заплата
            </Menu.Item>
          )}

          {(success?.transportions || role === "warehouse") && (
            <Menu.Item
              style={{ height: "35px" }}
              key="transportions"
              icon={<ShoppingOutlined />}
            >
              Передача товара
            </Menu.Item>
          )}
          {(success?.transportions || role === "warehouse") && (
            <Menu.Item
              style={{ height: "35px" }}
              key="unfinished"
              icon={<FaClipboardQuestion />}
            >
              Недоступные тов.
            </Menu.Item>
          )}
        </Menu>
      </Sider>
      <Layout
        className="site-layout"
        style={{
          overflow: "scroll",
        }}
      >
        <Header
          className="site-layout-background"
          style={{
            padding: "0 15px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Button type="primary" onClick={toggle}>
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </Button>
          <Button
            onClick={() => setOpenModal(true)}
            type="link"
            style={{ padding: 0 }}
          >
            <Badge
              count={products.length}
              style={{
                backgroundColor: "red",
                color: "white",
                fontWeight: "bold",
                boxShadow: "0 0 0 2px #fff",
              }}
              offset={[-5, 5]}
              showZero={false}
            >
              <IoIosNotifications color="white" size={30} />
            </Badge>
          </Button>

          <Modal
            footer={null}
            open={openModal}
            onCancel={() => setOpenModal(false)}
            title="Yuborilgan buyurtmalar"
          >
            {products?.map((item, index) => (
              <Card
                key={index}
                title={
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>{item.sender.name}</span>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Button onClick={() => handlePrint(item)} type="primary">
                        Chop etish
                      </Button>
                      <Button
                        type="text"
                        icon={<CloseOutlined />}
                        onClick={() => removeItem(item)}
                      />
                    </div>
                  </div>
                }
              >
                <Table
                  size="small"
                  columns={[
                    {
                      title: "Holat",
                      render: (text, record) => (
                        <Checkbox
                          checked={record.checked}
                          onChange={(e) =>
                            handleCheckboxChange(index, record, e)
                          }
                        />
                      ),
                    },
                    {
                      title: "Mahsulot nomi",
                      dataIndex: ["productId", "name"],
                    },
                    {
                      title: "Birlik",
                      dataIndex: "unit",
                      render: (text) => stm[text] || text,
                    },
                    {
                      title: "Soni",
                      dataIndex: "quantity",
                    },
                  ]}
                  dataSource={item.products}
                  pagination={false}
                />
              </Card>
            ))}
          </Modal>
        </Header>
        <Content
          className="site-layout-background"
          style={{
            padding: 6,
            minHeight: 280,
            minWidth: 280,
            overflow: "scroll",
          }}
        >
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
}
