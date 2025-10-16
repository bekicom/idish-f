import { useState } from "react";
import {
  useCreateClientMutation,
  useGetClientsQuery,
  useUpdateClientMutation,
} from "../../context/service/client.service";
import { Table, Spin, Button, Modal, Form, Input } from "antd";

const Client = () => {
  const { data: clients = [], isLoading, refetch } = useGetClientsQuery();
  const [createClient] = useCreateClientMutation();
  const [updateClient] = useUpdateClientMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [editingClientId, setEditingClientId] = useState(null);

  const showModal = () => {
    form.resetFields();
    setEditingClientId(null);
    setIsModalOpen(true);
  };

  const handleEdit = (client) => {
    form.setFieldsValue(client);
    setEditingClientId(client._id);
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingClientId) {
        await updateClient({ id: editingClientId, ...values });
      } else {
        await createClient(values);
      }
      setIsModalOpen(false);
      form.resetFields();
      setEditingClientId(null);
      refetch(); // Yangi malumotlarni olish
    } catch (error) {
      console.error("Xatolik:", error);
    }
  };

  const columns = [
    {
      title: "Ism",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Telefon",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Manzil",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "Amallar",
      key: "actions",
      render: (_, record) => (
        <Button type="link" onClick={() => handleEdit(record)}>
          Tahrirlash
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h2>Klientlar</h2>
        <Button type="primary" onClick={showModal}>
          Klient qo‘shish
        </Button>
      </div>

      {isLoading ? (
        <Spin size="large" />
      ) : (
        <Table
          columns={columns}
          dataSource={clients.map((client) => ({ ...client, key: client._id }))}
          bordered
        />
      )}

      <Modal
        title={
          editingClientId ? "Klientni tahrirlash" : "Yangi klient qo‘shish"
        }
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        okText={editingClientId ? "Yangilash" : "Qo‘shish"}
        cancelText="Bekor qilish"
      >
        <Form autoComplete="off" form={form} layout="vertical">
          <Form.Item
            label="Ism"
            name="name"
            rules={[{ required: true, message: "Iltimos, ism kiriting" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Telefon"
            name="phone"
            rules={[
              { required: true, message: "Iltimos, telefon kiriting" },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();

                  // Telefonni faqat raqamlarga ajratamiz
                  const cleanedInput = value.replace(/\D/g, "");

                  // 5 ta ketma-ket bir xil raqam bormi?
                  if (/(\d)\1{6,}/.test(cleanedInput)) {
                    return Promise.reject(
                      new Error(
                        "5 ta ketma-ket bir xil raqam bo'lishi mumkin emas"
                      )
                    );
                  }

                  const isDuplicate = clients.some(
                    (client) =>
                      client.phone.replace(/\D/g, "") === cleanedInput &&
                      client._id !== editingClientId // yangilashda o‘zini inkor qilamiz
                  );

                  if (isDuplicate) {
                    return Promise.reject(
                      new Error("Bu raqam bilan mijoz allaqachon mavjud")
                    );
                  }

                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Manzil"
            name="address"
            rules={[{ required: true, message: "Iltimos, manzil kiriting" }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Client;

// import React, { useEffect, useState } from "react";
// import { useGetSalesHistoryQuery } from "../../context/service/sales.service";
// import { DatePicker, Input, Select, Table, Button, Space, message } from "antd";
// import { PrinterOutlined } from "@ant-design/icons";
// import moment from "moment";
// import { useGetClientsQuery } from "../../context/service/client.service";
// import { useGetProductsPartnerQuery } from "../../context/service/partner.service";

// const { Option } = Select;

// const Sales = () => {
//   const { data: clients = [], refetch: refetchClients } = useGetClientsQuery(); // 👈 refetch qo‘shildi
//   const { data: partnerProducts = [], isLoading: isPartnerLoading } =
//     useGetProductsPartnerQuery();
//   const { data: sales = [], isLoading: isSalesLoading } =
//     useGetSalesHistoryQuery();
//   const [filters, setFilters] = useState({
//     productName: "",
//     productCode: "",
//     paymentMethod: "",
//     dateRange: [],
//     selectedClient: "",
//   });
//   const [filteredSales, setFilteredSales] = useState([]);

//   const supplierName = localStorage.getItem("user_login") || "Noma'lum";

//   // Unikal hamkorlar
//   const uniquePartners = Array.from(
//     new Map(
//       partnerProducts
//         .filter((p) => p?.name_partner && p.partner_number)
//         .map((p) => [
//           p.partner_number,
//           { name: p?.name_partner, id: p.partner_number },
//         ])
//     ).values()
//   );

//   useEffect(() => {
//     setFilteredSales(
//       sales.filter((sale) => {
//         const matchesProductName = sale.productId?.name
//           ?.toLowerCase()
//           .includes(filters.productName?.toLowerCase());
//         const matchesProductCode = sale.productId?.code
//           ?.toLowerCase()
//           .includes(filters.productCode?.toLowerCase());
//         const matchesClient = filters.selectedClient
//           ? sale.clientId?._id === filters.selectedClient ||
//           sale.partnerId === filters.selectedClient
//           : true;
//         const matchesPaymentMethod =
//           !filters.paymentMethod ||
//           sale.paymentMethod === filters.paymentMethod;
//         const matchesDateRange =
//           !filters.dateRange.length ||
//           (moment(sale.createdAt).isSameOrAfter(
//             moment(filters.dateRange[0]),
//             "day"
//           ) &&
//             moment(sale.createdAt).isSameOrBefore(
//               moment(filters.dateRange[1]),
//               "day"
//             ));
//         return (
//           matchesProductName &&
//           matchesProductCode &&
//           matchesPaymentMethod &&
//           matchesDateRange &&
//           matchesClient
//         );
//       })
//     );
//   }, [filters, sales]);

//   const getBuyerName = (sale) => {
//     if (sale.clientId?.name) return sale.clientId.name;
//     if (sale.partnerId) {
//       const partner = uniquePartners.find((p) => p.id === sale.partnerId);
//       return partner?.name || "Noma'lum (Partner topilmadi)";
//     }
//     return "Noma'lum";
//   };

//   const generatePDF = (sale) => {
//     const printWindow = window.open("", "", "width=600,height=600");

//     if (!printWindow) {
//       alert("Iltimos, brauzeringizda pop-up oynalarni ruxsat bering!");
//       return;
//     }

//     const totalPrice = (sale.sellingPrice || 0) * (sale.quantity || 0);
//     const paymentMethodText =
//       sale.paymentMethod === "cash"
//         ? "Naqd"
//         : sale.paymentMethod === "card"
//           ? "Karta"
//           : "Noma'lum";
//     const buyerName = getBuyerName(sale);

//     const tableRow = `
//       <tr>
//         <td>1</td>
//         <td>${sale.productId?.name || "Noma'lum"}</td>
//         <td>${sale.quantity || 0}</td>
//         <td>${sale.sellingPrice || 0}</td>
//         <td>${totalPrice.toLocaleString()}</td>
//         <td>${paymentMethodText}</td>
//         <td>${moment(sale.createdAt).format("DD.MM.YYYY HH:mm")}</td>
//       </tr>
//     `;

//     const content = `
//       <div style="width:210mm; height:297mm; padding:20px; font-family:Arial, sans-serif; color:#001529;">
//         <h2 style="text-align:center; margin-bottom:20px;">
//           ${moment().format("DD.MM.YYYY")} даги Хисобварак-фактура
//         </h2>
//         <div style="display:flex; justify-content:space-between; margin-bottom:20px;">
//           <div>
//             <b>Етказиб берувчи:</b><br/>
//             <p>${supplierName}</p>
//           </div>
//           <div>
//             <b>Сотиб олувчи:</b><br/>
//             <p>${buyerName}</p>
//           </div>
//         </div>
//         <table border="1" style="border-collapse:collapse; width:100%; text-align:center;">
//           <thead style="background:#001529; color:white;">
//             <tr>
//               <th>No</th>
//               <th>Mahsulot nomi</th>
//               <th>Soni</th>
//               <th>Sotish narxi</th>
//               <th>Umumiy summa</th>
//               <th>To'lov usuli</th>
//               <th>Sotish sanasi</th>
//             </tr>
//           </thead>
//           <tbody>${tableRow}</tbody>
//         </table>
//       </div>
//     `;

//     printWindow.document.write(`
//       <html>
//         <head><title>Хисобварак-фактура - ${buyerName}</title></head>
//         <body>${content}</body>
//       </html>
//     `);
//     printWindow.document.close();
//     printWindow.print();
//     printWindow.close();
//   };

//   const columns = [
//     {
//       title: "Xaridor ismi",
//       key: "buyerName",
//       render: (_, record) => getBuyerName(record),
//     },
//     {
//       title: "Mahsulot nomi",
//       dataIndex: ["productId", "name"],
//       key: "productId",
//     },
//     {
//       title: "Mahsulot kodi",
//       dataIndex: ["productId", "code"],
//       key: "productId",
//     },
//     {
//       title: "Mahsulot o'lchami",
//       dataIndex: ["productId", "size"],
//       key: "productId",
//     },
//     { title: "Ombor", dataIndex: ["warehouseId", "name"], key: "warehouseId" },
//     { title: "Soni", dataIndex: "quantity", key: "quantity" },
//     { title: "To'lov usuli", dataIndex: "paymentMethod", key: "paymentMethod" },
//     {
//       title: "Sotib olish narxi",
//       key: "purchasePrice",
//       render: (_, record) =>
//         `${record.productId?.purchasePrice?.value || 0} ${record.productId?.currency || "N/A"
//         }`,
//     },
//     {
//       title: "Sotish narxi",
//       dataIndex: "sellingPrice",
//       render: (value) => (value ? `${value?.toFixed(2)}` : "0.00"),
//     },
//     {
//       title: "To'lov(so'm)",
//       render: (_, record) => {
//         const sum = record.payment?.sum;
//         return sum !== undefined && sum !== null
//           ? `${sum?.toFixed(2)} so'm`
//           : "0.00 so'm";
//       },
//     },
//     {
//       title: "To'lov($)",
//       render: (_, record) => {
//         const usd = record.payment?.usd;
//         return usd !== undefined && usd !== null
//           ? `${usd?.toFixed(2)}$`
//           : "0.00$";
//       },
//     },
//     {
//       title: "Sotish sanasi",
//       dataIndex: "createdAt",
//       key: "createdAt",
//       render: (text) => moment(text).format("DD.MM.YYYY HH:mm"),
//     },
//     {
//       title: "Harakat",
//       key: "actions",
//       render: (_, record) => (
//         <Button
//           type="primary"
//           icon={<PrinterOutlined />}
//           onClick={() => generatePDF(record)}
//         >
//           Chop etish
//         </Button>
//       ),
//     },
//   ];

//   if (isSalesLoading || isPartnerLoading) {
//     return <div>Yuklanmoqda...</div>;
//   }

//   return (
//     <div style={{ overflowX: 'auto' }} className="sales-page">
//       <div className="page_header">
//         <h1>Sotilgan Mahsulotlar</h1>
//         <div className="header_actions">
//           <Space>
//             <Input
//               style={{ width: "300px" }}
//               placeholder="Mahsulot nomi"
//               onChange={(e) =>
//                 setFilters({ ...filters, productName: e.target.value })
//               }
//             />
//             <Input
//               style={{ width: "200px" }}
//               placeholder="Mahsulot kodi"
//               onChange={(e) =>
//                 setFilters({ ...filters, productCode: e.target.value })
//               }
//             />
//             <Select
//               style={{ width: "200px" }}
//               onChange={(value) =>
//                 setFilters({ ...filters, selectedClient: value })
//               }
//               value={filters.selectedClient}
//               placeholder="Xaridor tanlang"
//               onFocus={refetchClients} // 👈 Xaridor tanlash paytida qayta yuklaydi
//             >
//               <Option value="">Barchasi</Option>
//               {clients.map((client) => (
//                 <Option key={client._id} value={client._id}>
//                   {client.name} (Xaridor)
//                 </Option>
//               ))}
//               {uniquePartners.map((partner) => (
//                 <Option key={partner.id} value={partner.id}>
//                   {partner.name} (Hamkor)
//                 </Option>
//               ))}
//             </Select>
//             <Select
//               style={{ width: "150px" }}
//               placeholder="To'lov usuli"
//               onChange={(value) =>
//                 setFilters({ ...filters, paymentMethod: value })
//               }
//               value={filters.paymentMethod}
//             >
//               <Option value="">Barchasi</Option>
//               <Option value="cash">Naqd</Option>
//               <Option value="card">Karta</Option>
//             </Select>
//             <DatePicker.RangePicker
//               style={{ width: "300px" }}
//               placeholder={["Dan", "Gacha"]}
//               onChange={(dates, dateStrings) => {
//                 if (!dateStrings[0] || !dateStrings[1]) {
//                   setFilters({ ...filters, dateRange: [] });
//                 } else {
//                   setFilters({ ...filters, dateRange: dateStrings });
//                 }
//               }}
//             />
//           </Space>
//         </div>
//       </div>
//       <Table scroll={{ x: "max-content" }} columns={columns} dataSource={filteredSales} rowKey="_id" />
//     </div>
//   );
// };

// export default Sales;
