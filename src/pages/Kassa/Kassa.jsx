import { useEffect, useMemo, useState } from "react";
import { useGetProductsQuery } from "../../context/service/product.service";
import {
  useGetClientsQuery,
  useCreateClientMutation,
} from "../../context/service/client.service";
import {
  Button,
  Input,
  Table,
  Modal,
  Select,
  Form,
  message,
  Space,
} from "antd";
import { InputNumber } from "antd";

import "./kassa.css";
import { MdDeleteForever } from "react-icons/md";
import { useSellProductMutation } from "../../context/service/sales.service";
import { useGetUsdRateQuery } from "../../context/service/usd.service";
import {
  useCreateDebtMutation,
  useGetAllDebtorsQuery,
} from "../../context/service/debt.service";
import { useGetPromosQuery } from "../../context/service/promo.service";
import { useNavigate } from "react-router-dom";
import {
  useAddExpenseMutation,
  useGetExpensesQuery,
} from "../../context/service/expense.service";
import moment from "moment";
import html2pdf from "html2pdf.js";
import yodgor_abdullaev from "../../assets/yodgor_abdullaev.svg";
import zolotayaroza77 from "../../assets/zolotayaroza77.svg";
import { useGetStoresQuery } from "../../context/service/ombor.service";

const { Option } = Select;

const Kassa = () => {
  const { data: products = [] } = useGetProductsQuery();
  const { data: debtors = [] } = useGetAllDebtorsQuery();
  console.log(debtors);

  const { data: promos = [] } = useGetPromosQuery();
  const { data: usdRate = {} } = useGetUsdRateQuery();
  const { data: clients = [] } = useGetClientsQuery();
  const { data: expenses = [] } = useGetExpensesQuery();
  const [createClient] = useCreateClientMutation();
  const [createDebt] = useCreateDebtMutation();
  const [addExpense] = useAddExpenseMutation();
  const [sellProduct] = useSellProductMutation();
  const { data: storelar } = useGetStoresQuery();
  const [categories, setCategories] = useState([]);
  const [form] = Form.useForm();
  const [categoryForm] = Form.useForm();
  const [sellForm] = Form.useForm();
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [xarajatModal, setXarajatModal] = useState(false);
  const navigate = useNavigate();
  const [selectedBuyer, setSelectedBuyer] = useState("");
  const [buyerType, setBuyerType] = useState(null);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [codeSearchText, setCodeSearchText] = useState("");
  const [basket, setBasket] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentDiscount, setPaymentDiscount] = useState("");
  const [dueDate, setDueDate] = useState(null);
  const [currency, setCurrency] = useState("SUM");
  const [selectedUnit, setSelectedUnit] = useState("quantity");
  const userLogin =
    localStorage.getItem("user_login") || "Noma'lum foydalanuvchi";

  const allProducts = useMemo(() => {
    return products.map((product) => ({
      ...product,
      name: product.name || "Noma'lum",
      barcode: product.barcode || "",
      code: product.code || "",
      partnerName: product.name_partner || "Noma'lum",
    }));
  }, [products]);

  const combinedPartners = [
    ...allProducts
      .filter((p) => p.partnerName && p.partner_number)
      .map((p) => ({
        name: p.partnerName,
        id: p.partner_number,
      })),
  ];

  const uniquePartners = Array.from(
    new Map(combinedPartners.map((p) => [p.id, p])).values()
  );

  useEffect(() => {
    const uniqueCategories = [
      ...new Set(expenses.map((expense) => expense.category)),
    ];
    setCategories(uniqueCategories);
  }, [expenses]);

  useEffect(() => {
    let result = [];

    const codeSearchLower = codeSearchText.toLowerCase();
    const searchLower = searchText.toLowerCase();

    if (codeSearchLower) {
      result = allProducts.filter((product) => {
        const code = (product.code || "").toLowerCase();
        return code.startsWith(codeSearchLower);
      });
    } else if (searchLower) {
      result = allProducts.filter((product) => {
        const name = (product?.name || "").toLowerCase();
        const code = (product?.code || "").toLowerCase();
        const size = (product?.size || "").toLowerCase();
        const category = (product?.category || "").toLowerCase();
        const barcode = (product?.barcode || "").toLowerCase();
        return (
          name.includes(searchLower) ||
          barcode.includes(searchLower) ||
          code.includes(searchLower) ||
          size.includes(searchLower) ||
          category.includes(searchLower)
        );
      });
    }

    setFilteredProducts(result);
  }, [allProducts, searchText, codeSearchText]);

  const handleCancel = () => {
    setXarajatModal(false);
    form.resetFields();
  };

  const handleAdd = async (values) => {
    await addExpense(values);
    setXarajatModal(false);
    form.resetFields();
  };

  const handleAddCategory = (values) => {
    setCategories([...categories, values.category]);
    setIsCategoryModalVisible(false);
    categoryForm.resetFields();
  };
const totalAmount = products.reduce(
  (sum, item) => sum + Number(item.totalAmount || 0),
  0
);



  const convertPrice = (price, fromCurrency, toCurrency, rate) => {
    if (fromCurrency === toCurrency) return price;
    if (fromCurrency === "USD" && toCurrency === "SUM") {
      return price * rate;
    }
    if (fromCurrency === "SUM" && toCurrency === "USD") {
      return price / rate;
    }
    if (fromCurrency === "USD" && toCurrency === "KGS") {
      return price * usdRate?.kgs;
    }
    if (fromCurrency === "KGS" && toCurrency === "USD") {
      return price / usdRate?.kgs;
    }
    return price;
  };

  const formatNumber = (num) => {
    return Number(num?.toFixed(2)).toLocaleString();
  };

  // 🔧 Xavfsiz convertToQuantity
  const convertToQuantity = (item) => {
    const q = Number(item.quantity) || 0;
    const perPackage = Number(item.quantity_per_package) || 1;
    const perBox = Number(item.package_quantity_per_box) || 1;

    if (item.unit === "quantity") return q;

    if (item.unit === "package_quantity") {
      return q * perPackage;
    }

    if (item.unit === "box_quantity") {
      // ✅ isPackage bo‘lishidan qat’i nazar ishlaydi
      return q * perPackage * perBox;
    }

    return q; // fallback
  };

  //
  const generatePDF = () => {
    const getDiscountedPrice = (item) => {
      const quantity = convertToQuantity(item);
      const basePrice = item.sellingPrice.value;

      const itemPromo = promos.find((p) => p._id === item.promokodId) || 0;
      const itemPromoPercent = itemPromo?.percent || 0;

      const globalPromo = promos.find((p) => p._id === paymentDiscount);
      const globalPromoPercent = globalPromo?.percent || 0;

      const priceAfterItemPromo =
        basePrice - (basePrice * itemPromoPercent) / 100;
      const priceAfterGlobalPromo =
        priceAfterItemPromo - (priceAfterItemPromo * globalPromoPercent) / 100;

      const discountedPrice = priceAfterGlobalPromo;
      const totalAmount = discountedPrice * quantity;

      return {
        discountedPrice,
        totalDiscount: itemPromoPercent + globalPromoPercent,
        totalAmount,
      };
    };
    const { totalUSD, totalSUM, totalKYG } = basket.reduce(
      (acc, item) => {
        const { totalAmount } = getDiscountedPrice(item);

        if (item.currency === "USD") {
          acc.totalUSD += totalAmount;
        } else if (item.currency === "SUM") {
          acc.totalSUM += totalAmount;
        } else {
          acc.totalKYG += totalAmount;
        }

        return acc;
      },
      { totalUSD: 0, totalSUM: 0, totalKGS: 0 }
    );

    const statusTexts = {
      quantity: "штук",
      box_quantity: "каробка",
      package_quantity: "пачка",
    };

    const formValues = sellForm.getFieldsValue();

    let buyerName = "Noma'lum";
    let buyerAddress = "Noma'lum";
    let buyerPhone = storelar?.find((s) => s.login === userLogin)?.phone;
    let paymentType = sellForm.getFieldValue("paymentMethod");

    const getBasketTotal = (basket, selectedUnit) => {
      return basket.reduce((sum, item) => {
        const quantity =
          selectedUnit === "quantity"
            ? item.quantity
            : selectedUnit === "package_quantity"
            ? item.quantity * item.quantity_per_package
            : selectedUnit === "box_quantity"
            ? item.quantity *
              item.quantity_per_package *
              item.package_quantity_per_box
            : 0;

        const { discountedPrice } = getDiscountedPrice(item);
        const totalAmount = Math.max(discountedPrice * quantity, 0);

        return sum + totalAmount;
      }, 0);
    };

    let initialPayment = sellForm.getFieldValue("initialPayment") || 0;

    if (buyerType === "client" && selectedBuyer) {
      const client = clients.find((c) => c._id === selectedBuyer);
      buyerName = client?.name || formValues.clientName || "Noma'lum";
      buyerAddress = client?.address || formValues.clientAddress || "Noma'lum";
    } else if (buyerType === "partner" && selectedBuyer) {
      const partner = uniquePartners.find((p) => p.id === selectedBuyer);
      buyerName = partner?.name || "Noma'lum";
      buyerAddress = "Hamkor manzili yo'q";
    } else {
      buyerName = formValues.clientName || "Noma'lum";
      buyerAddress = formValues.clientAddress || "Noma'lum";
    }
    const tableRows = basket
      .map((item, index) => {
        const quantity =
          selectedUnit === "quantity"
            ? item.quantity
            : selectedUnit === "package_quantity"
            ? item.quantity * item.quantity_per_package
            : selectedUnit === "box_quantity"
            ? item.quantity *
              item.quantity_per_package *
              item.package_quantity_per_box
            : 0;

        const { totalAmount, totalDiscount } = getDiscountedPrice(item);

        return `
      <tr style="text-align: center;">
        <td style="padding: 8px;">${index + 1}</td>
        <td style="padding: 8px;">${item?.name || "Noma'lum mahsulot"}</td>
        <td style="padding: 8px;">${item?.size || "-"}</td>
        <td style="padding: 8px;">${item?.code || "-"}</td>
        <td style="padding: 8px;">${quantity}</td>
<td style="padding: 8px;">
  ${formatNumber(item?.sellingPrice?.value / (1 - item?.discount / 100))}
</td>
        <td style="padding: 8px;">${
          item.currency === "USD"
            ? "Доллар"
            : item.currency === "SUM"
            ? "Сум"
            : "KYG"
        }</td>
        <td style="padding: 8px;">${`${item.discount} %`}</td>
        <td style="padding: 8px;">${formatNumber(totalAmount)}</td>
      </tr>
    `;
      })
      .join("");

    const content = `
  <div style="width: 210mm;  padding: 20px; font-family: Arial, sans-serif; background-color: #f9f9f9; box-sizing: border-box;">
    <div style="border: 2px solid #1a73e8; border-radius: 12px; padding: 20px; background-color: #ffffff; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); page-break-inside: avoid;">
      
      <!-- Sarlavha -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 18px; color: #1a73e8;">
          ${moment().format("DD.MM.YYYY, HH:mm:ss")} счет-фактура
        </h2>
        <span style="font-size: 16px; color: #555;">
          ${paymentType === "credit" ? "Долг" : "Продажа"}
        </span>
      </div>

      <!-- Ma'lumotlar -->
      <div style="display: flex; width: 100%; margin-bottom: 20px; page-break-inside: avoid;">
        <div style="display: flex; flex-direction: column; gap: 10px; width: 50%;">
          <div><b style="color: #333;">Поставщик:</b> <p style="margin: 5px 0; color: #555;">${userLogin}</p></div>
          <div><b style="color: #333;">Телефон:</b> <p style="margin: 5px 0; color: #555;">${buyerPhone}</p></div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px; width: 50%;">
          <div><b style="color: #333;">Покупатель:</b> <p style="margin: 5px 0; color: #555;">${buyerName}</p></div>
          <div><b style="color: #333;">Адрес:</b> <p style="margin: 5px 0; color: #555;">${buyerAddress}</p></div>
        </div>
      </div>

      <!-- Jadval -->
      <table style="border-collapse: collapse; width: 100%; margin-bottom: 20px; border: 1px solid #e0e0e0; page-break-inside: auto;">
        <thead style="display: table-header-group;">
          <tr style="background-color: #f1f3f4; text-align: center;">
            <th style="padding: 10px; border: 1px solid #e0e0e0;">№</th>
            <th style="padding: 10px; border: 1px solid #e0e0e0;">Название продукта</th>
            <th style="padding: 10px; border: 1px solid #e0e0e0;">Размер</th>
            <th style="padding: 10px; border: 1px solid #e0e0e0;">Код</th>
            <th style="padding: 10px; border: 1px solid #e0e0e0;">Количество</th>
            <th style="padding: 10px; border: 1px solid #e0e0e0;">Цена</th>
            <th style="padding: 10px; border: 1px solid #e0e0e0;">Валюта</th>
            <th style="padding: 10px; border: 1px solid #e0e0e0;">Скидка</th>
            <th style="padding: 10px; border: 1px solid #e0e0e0;">Общая сумма</th>
          </tr>
        </thead>
        <tbody style="display: table-row-group;">
          ${tableRows}
        </tbody>
      </table>

      <!-- Yakuniy ma'lumotlar -->
      <div style="margin-bottom: 20px; page-break-inside: avoid;">
        <b style="color: #333;">Общая скидка: ${
          promos.find((p) => p._id === paymentDiscount)?.percent || "-"
        } %</b><br/>
        <b style="color: #333;">Долларовая часть общей суммы платежа составляет: ${formatNumber(
          totalUSD
        )} доллар</b><br/>
        <b style="color: #333;">Сумовая часть общей суммы платежа составляет: ${formatNumber(
          totalSUM - initialPayment
        )} сум</b><br/>
        <b style="color: #333;">KGS часть общей суммы платежа составляет: ${formatNumber(
          totalKYG
        )} KGS</b><br/>           
        <b style="color: #333;">Срок погашения задолженности: ${
          dueDate || "-"
        }</b><br />
        <b style="color: #333;">Старые долги ${debtors
          .filter(
            (d) =>
              d.partnerId === selectedBuyer || d.clientId?._id === selectedBuyer
          )
          .reduce((acc, item) => acc + item.remainingAmount, 0)} USD</b>
      </div>

      <!-- QR kodlar -->
      <div style="display: flex; justify-content: space-around; margin-top: 20px; border-top: 1px solid #e0e0e0; padding-top: 20px; page-break-inside: avoid;">
        <div style="text-align: center;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://t.me/YODGOR_ABDULLAEV" style="width: 100px; height: 100px; border-radius: 10px; background: white; padding: 10px;" />
          <p style="margin: 5px 0; font-size: 12px; color: #000;">@YODGOR_ABDULLAEV</p>
        </div>
        <div style="text-align: center;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://t.me/ZOLOTAYAROZA77" style="width: 100px; height: 100px; border-radius: 10px; background: white; padding: 10px;" />
          <p style="margin: 5px 0; font-size: 12px; color: #000;">@ZOLOTAYAROZA77</p>
        </div>
      </div>

    </div>
  </div>
`;

    const element = document.createElement("div");
    element.innerHTML = content;
    document.body.appendChild(element);

    const opt = {
      margin: [0, 0, 0, 0],
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      filename: `invoice_${moment().format("DD-MM-YYYY_HH-mm-ss")}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        scrollY: 0, // <-- yangi
        windowWidth: document.body.scrollWidth, // <-- yangi
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
        compress: true, // <-- yangi
      },
    };

    html2pdf()
      .set(opt)
      .from(element)
      .toPdf()
      .get("pdf")
      .then((pdf) => {
        document.body.removeChild(element);
        const pdfBlob = pdf.output("bloburl");
        const printWindow = window.open(pdfBlob);
        printWindow.onload = () => {
          printWindow.print();
        };
      })
      .catch((error) => {
        console.error("Ошибка при генерации PDF:", error);
        document.body.removeChild(element);
      });
  };

  const productsColumn = [
    {
      title: "Tovar",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {record.image_url ? (
            <img
              src={record.image_url}
              alt={record.name}
              style={{
                width: "100px",
                height: "100px",
                marginRight: "10px",
                objectFit: "contain",
              }}
            />
          ) : (
            <div
              style={{
                width: "50px",
                height: "50px",
                marginRight: "10px",
                backgroundColor: "#f0f0f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Rasm yo'q
            </div>
          )}
          <span>{record.name}</span>
        </div>
      ),
    },
    { title: "O'lcham", dataIndex: "size", key: "size" },
    { title: "Ombor", render: (_, record) => record.warehouse?.name || "-" },
    { title: "Kod", dataIndex: "code", key: "code" },
    {
      title: "Karobka soni",
      render: (_, record) => {
        const dona = convertToQuantity(record);
        const karobka = record.box_quantity || 0;
        return `${karobka} karobka (${dona} dona)`;
      },
    },

    {
      title: "Sotish narxi",
      render: (_, record) => {
        const price = record.sellingPrice?.value || 0;
        const productCurrency = record.currency || "SUM";
        const convertedPrice = convertPrice(
          price,
          productCurrency,
          currency,
          usdRate?.rate
        );
        return `${formatNumber(convertedPrice)} ${
          currency === "SUM" ? "сум" : currency === "USD" ? "$" : "KGS"
        }`;
      },
    },
    {
      title: "Amallar",
      render: (_, record) => (
        <Button
          onClick={() => {
            const existProduct = basket.find((item) => item._id === record._id);
            if (!existProduct) {
              const price = record.sellingPrice?.value || 0;
              const productCurrency = record.currency || "SUM";
              setBasket([
                {
                  ...record,
                  quantity: 1,
                  promokodId: null,
                  unit: "quantity",
                  currency: currency,
                  originalPrice: {
                    value: price,
                    currency: productCurrency,
                  },
                  sellingPrice: {
                    value: convertPrice(
                      price,
                      productCurrency,
                      currency,
                      usdRate?.rate
                    ),
                    currency: currency,
                  },
                },
                ...basket,
              ]);
            } else {
              existProduct.quantity += 1;
              setBasket([...basket]);
            }
          }}
          type="primary"
          disabled={record.box_quantity <= 0} // Karobka soni 0 yoki manfiy bo'lsa tugmani o'chirish
        >
          Tanlash
        </Button>
      ),
    },
  ];

  const findWarehouse = (item) =>
    allProducts.filter((p) =>
      [item].some(
        (b) =>
          b.code === p.code && b.name === p.name && b.quantity <= p.quantity
      )
    );

  const basketColumn = [
    {
      title: "Tovar",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {record.image_url ? (
            <img
              src={record.image_url}
              alt={record.name}
              style={{
                width: "100px",
                height: "100px",
                marginRight: "10px",
                objectFit: "contain",
              }}
            />
          ) : (
            <div
              style={{
                width: "50px",
                height: "50px",
                marginRight: "10px",
                backgroundColor: "#f0f0f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Rasm yo'q
            </div>
          )}
          <span>{record.name}</span>
        </div>
      ),
    },
    { title: "Ombor", render: (_, record) => record.warehouse?.name || "-" },
    {
      title: "Soni",
      render: (_, record) => (
        <div
          className="table_actions"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <InputNumber
            min={1}
            value={record.quantity}
            onChange={(value) => {
              const newBasket = basket.map((item) => {
                if (item._id === record._id) {
                  return { ...item, quantity: value };
                }
                return item;
              });
              setBasket(newBasket);
            }}
          />
        </div>
      ),
    },

    {
      title: "Sotish valyutasi",
      render: (_, record) => (
        <Select
          value={record.currency}
          onChange={(value) => {
            const newBasket = basket.map((item) => {
              if (item._id === record._id) {
                const convertedPrice = convertPrice(
                  item.originalPrice.value,
                  item.originalPrice.currency,
                  value,
                  usdRate?.rate
                );
                return {
                  ...item,
                  currency: value,
                  sellingPrice: {
                    ...item.sellingPrice,
                    value: convertedPrice,
                    currency: value,
                  },
                };
              }
              return item;
            });
            setBasket(newBasket);
          }}
        >
          <Option value="USD">USD</Option>
          <Option value="SUM">SUM</Option>
          <Option value="KGS">KGS</Option>
        </Select>
      ),
    },
    {
      title: "Sotish narxi",
      render: (_, record) => (
        <InputNumber
          min={0}
          value={record.sellingPrice?.value}
          onChange={(value) => {
            const newBasket = basket.map((item) => {
              if (item._id === record._id) {
                return {
                  ...item,
                  sellingPrice: {
                    ...item.sellingPrice,
                    value: value,
                  },
                };
              }
              return item;
            });
            setBasket(newBasket);
          }}
        />
      ),
    },

    {
      title: "O'lchov birlik",
      render: (_, record) => (
        <Select
          style={{ width: "100px" }}
          required
          onChange={(value) => {
            setBasket((prev) =>
              prev.map((item) =>
                item._id === record._id ? { ...item, unit: value } : item
              )
            );
          }}
          value={record.unit}
          placeholder="Tanlang"
        >
          <Select.Option value="quantity">Dona</Select.Option>
          <Select.Option disabled={!record.isPackage} value="package_quantity">
            Pachka
          </Select.Option>
          <Select.Option value="box_quantity">Karobka</Select.Option>
        </Select>
      ),
    },
    // {
    //   title: "Promokod",
    //   render: (_, record) => (
    //     <Select
    //       style={{ width: "200px" }}
    //       onChange={(value) => {
    //         setBasket((prev) =>
    //           prev.map((item) =>
    //             item._id === record._id ? { ...item, promokodId: value } : item
    //           )
    //         );
    //       }}
    //       value={record.promokodId}
    //       placeholder="Tanlang"
    //     >
    //       <Select.Option value={null}>Promokodsiz</Select.Option>
    //       {promos.map((item) => (
    //         <Select.Option
    //           disabled={item.promo_type === "overall"}
    //           value={item._id}
    //         >
    //           {item.code}
    //         </Select.Option>
    //       ))}
    //     </Select>
    //   ),
    // },
    {
      title: "Amallar",
      render: (_, record) => (
        <Button
          type="primary"
          onClick={() =>
            setBasket(basket.filter((item) => item._id !== record._id))
          }
        >
          <MdDeleteForever />
        </Button>
      ),
    },
    {
      title: "ombor",
      render: (_, p) => (
        <Select
          showSearch
          style={{ width: "150px" }}
          placeholder="Omborni tanlang"
          value={p.warehouse.name}
          optionFilterProp="children"
          onChange={(val) => {
            const updatedProduct = allProducts.find(
              (product) =>
                product.code === p.code &&
                product.name === p.name &&
                product.warehouse?._id === val
            );

            if (!updatedProduct) {
              message.error("Tanlangan omborda mahsulot topilmadi");
              return;
            }

            setBasket((prev) =>
              prev.map((item) =>
                item._id === p._id
                  ? {
                      ...updatedProduct,
                      quantity: item.quantity,
                      currency: item.currency,
                      originalPrice: item.originalPrice,
                      sellingPrice: item.sellingPrice,
                      selectedWarehouse: val,
                    }
                  : item
              )
            );
          }}
          filterOption={(input, option) =>
            option.children.toLowerCase().includes(input.toLowerCase())
          }
        >
          {findWarehouse(p)?.map((item) => (
            <Select.Option key={item.warehouse._id} value={item.warehouse._id}>
              {item.warehouse.name}
            </Select.Option>
          ))}
        </Select>
      ),
    },
  ];

  const handleSell = async () => {
    try {
      await sellForm.validateFields();
      const formValues = sellForm.getFieldsValue();
      const initialPayment = Number(formValues.initialPayment || 0);

      if (!paymentMethod || (paymentMethod === "credit" && !dueDate)) {
        message.error("Barcha maydonlarni to'ldiring!");
        return;
      }

      let clientId = null;
      let partnerId = null;

      if (buyerType === "client" && selectedBuyer) {
        clientId = selectedBuyer;
      } else if (buyerType === "partner" && selectedBuyer) {
        partnerId = selectedBuyer;
      } else if (!selectedBuyer) {
        const clientResponse = await createClient({
          name: formValues.clientName,
          phone: formValues.clientPhone,
          address: formValues.clientAddress,
        }).unwrap();
        clientId = clientResponse._id;
      }

      const overallPromo = paymentDiscount
        ? promos.find((p) => p._id === paymentDiscount)
        : null;

      const products = basket.map((item) => {
        const quantity =
          item.unit === "quantity"
            ? item.quantity
            : item.unit === "package_quantity"
            ? item.quantity * item.quantity_per_package
            : item.quantity *
              item.quantity_per_package *
              item.package_quantity_per_box;

        const productPromo = promos.find((p) => p._id === item.promokodId);
        const itemDiscount =
          (productPromo?.percent || 0) + (overallPromo?.percent || 0);

        const basePrice = item.sellingPrice.value;
        const discountedUnitPrice =
          basePrice - (basePrice * itemDiscount) / 100;
        const totalAmount = Math.max(discountedUnitPrice * quantity, 0);

        return {
          productId: item._id,
          warehouseId: item.warehouse?._id,
          quantity,
          unit: item.unit,
          currency: item.currency,
          sellingPrice: discountedUnitPrice,
          totalAmount,
          promokodId: productPromo?._id || null,
          discount: itemDiscount,
        };
      });

  if (paymentMethod === "credit") {
    // 🔹 Umumiy qarz summasini hisoblaymiz
    const totalAmount = products.reduce(
      (sum, item) => sum + Number(item.totalAmount || 0),
      0
    );

    await createDebt({
      clientId,
      partnerId,
      dueDate,
      promokodId: overallPromo?._id || null,
      storeId: localStorage.getItem("_id"),
      totalAmount, // 🔥 Majburiy qo‘shamiz!
      paymentHistory:
        initialPayment > 0
          ? [
              {
                date: moment().format("YYYY-MM-DD"),
                amount: initialPayment,
                currency: "SUM",
                storeId: localStorage.getItem("_id"),
              },
            ]
          : [],
      products,
    }).unwrap();
  } else {
    await Promise.all(
      products.map((item) =>
        sellProduct({
          ...item,
          clientId,
          partnerId,
          paymentMethod,
          selectedWarehouse: basket.find((b) => b._id === item.productId)
            ?.selectedWarehouse,
          senderId: localStorage.getItem("_id"),
        }).unwrap()
      )
    );
  }

      generatePDF();
      setIsModalVisible(false);
      setBasket([]);
      setPaymentMethod("");
      setSelectedBuyer("");
      setBuyerType(null);
      setDueDate(null);
      sellForm.resetFields();
      message.success("Sotuv muvaffaqiyatli yakunlandi");
    } catch (error) {
      console.error("❌ Xatolik:", error);
      message.error("Xatolik yuz berdi");
    }
  };

  return (
    <div className="page" style={{ marginTop: "8px", paddingInline: "4px" }}>
      <div className="products">
        <div
          className="products_header"
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <Input
            autoFocus
            type="search"
            placeholder="Tovarni nomi yoki shtrix kodi orqali topish"
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              if (codeSearchText) setCodeSearchText("");
            }}
            style={{ flex: 1, minWidth: "200px" }}
            disabled={codeSearchText.length > 0}
          />
          <Input
            type="search"
            placeholder="Kod orqali qidirish (birinchi 3 ta belgi)"
            value={codeSearchText}
            onChange={(e) => {
              setCodeSearchText(e.target.value);
              if (searchText) setSearchText("");
            }}
            style={{ flex: 1, minWidth: "200px" }}
            disabled={searchText.length > 0}
          />
          <Select
            value={currency}
            onChange={(value) => setCurrency(value)}
            style={{ width: "100px" }}
          >
            <Option value="SUM">SUM</Option>
            <Option value="USD">USD</Option>
            <Option value="KGS">KGS</Option>
          </Select>
          <Button
            style={{ justifySelf: "end", display: "flex" }}
            type="primary"
            onClick={() => navigate("/debtors")}
          >
            Qarzdorlar
          </Button>
          <Button
            style={{ justifySelf: "end", display: "flex" }}
            type="primary"
            onClick={() => navigate("/dalolatnoma")}
          >
            Dalolatnoma
          </Button>
          <Button
            style={{ justifySelf: "end", display: "flex" }}
            type="primary"
            onClick={() => setXarajatModal(true)}
          >
            Xarajat qo'shish
          </Button>
        </div>
        <Table
          size="small"
          style={{ overflow: "auto", minWidth: "100%", maxHeight: "100%" }}
          pagination={{ pageSize: 4 }}
          columns={productsColumn}
          dataSource={filteredProducts}
          rowKey="_id"
        />
      </div>
      <Button
        style={{
          maxWidth: "170px",
          display: "flex",
          justifySelf: "end",
          alignSelf: "end",
          marginRight: "15px",
        }}
        type="primary"
        onClick={() => setIsModalVisible(true)}
      >
        Sotish
      </Button>
      {basket.length > 0 && (
        <div className="basket">
          <Table
            size="small"
            style={{ overflow: "auto", minWidth: "100%", maxHeight: "100%" }}
            pagination={{ pageSize: 5 }}
            columns={basketColumn}
            dataSource={basket}
            rowKey="_id"
          />

          <Space direction="vertical" style={{ color: "#fff" }}>
            <p>
              Umumiy to'lov USD qismi:{" "}
              <strong>
                {basket
                  .filter((p) => p.currency === "USD")
                  .reduce((acc, item) => {
                    const quantity = convertToQuantity(item);
                    const itemPromo = promos.find(
                      (p) => p._id === item.promokodId
                    );
                    const basePrice = item.sellingPrice.value;
                    const discountedItemPrice = itemPromo
                      ? basePrice - (basePrice * itemPromo?.percent) / 100
                      : basePrice;

                    const subtotal = quantity * discountedItemPrice;

                    const globalPromo = promos.find(
                      (p) => p._id === paymentDiscount
                    );
                    const globalDiscount = globalPromo
                      ? (subtotal * globalPromo?.percent) / 100
                      : 0;

                    return acc + Number((subtotal - globalDiscount).toFixed(2));
                  }, 0)}
              </strong>
            </p>
            <p>
              Umumiy to'lov UZS qismi:{" "}
              <strong>
                {basket
                  .filter((p) => p.currency === "SUM")
                  .reduce((acc, item) => {
                    const quantity = convertToQuantity(item);
                    const itemPromo = promos.find(
                      (p) => p._id === item.promokodId
                    );
                    const basePrice = item.sellingPrice.value;
                    const discountedItemPrice = itemPromo
                      ? basePrice - (basePrice * itemPromo?.percent) / 100
                      : basePrice;

                    const subtotal = quantity * discountedItemPrice;

                    const globalPromo = promos.find(
                      (p) => p._id === paymentDiscount
                    );
                    const globalDiscount = globalPromo
                      ? (subtotal * globalPromo?.percent) / 100
                      : 0;

                    return acc + Number((subtotal - globalDiscount).toFixed(2));
                  }, 0)}
              </strong>
            </p>
            <p>
              Umumiy to'lov KYG qismi:{" "}
              <strong>
                {basket
                  .filter((p) => p.currency === "KYG")
                  .reduce((acc, item) => {
                    const quantity = convertToQuantity(item);
                    const itemPromo = promos.find(
                      (p) => p._id === item.promokodId
                    );
                    const basePrice = item.sellingPrice.value;
                    const discountedItemPrice = itemPromo
                      ? basePrice - (basePrice * itemPromo?.percent) / 100
                      : basePrice;

                    const subtotal = quantity * discountedItemPrice;

                    const globalPromo = promos.find(
                      (p) => p._id === paymentDiscount
                    );
                    const globalDiscount = globalPromo
                      ? (subtotal * globalPromo?.percent) / 100
                      : 0;

                    return acc + Number((subtotal - globalDiscount).toFixed(2));
                  }, 0)}
              </strong>
            </p>
          </Space>
        </div>
      )}

      <Modal
        title="Yangi kategoriya qo'shish"
        visible={isCategoryModalVisible}
        onCancel={() => setIsCategoryModalVisible(false)}
        footer={null}
      >
        <Form
          form={categoryForm}
          onFinish={handleAddCategory}
          layout="vertical"
        >
          <Form.Item
            name="category"
            label="Kategoriya nomi"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Qo'shish
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Rasxod qo'shish"
        visible={xarajatModal}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          autoComplete="off"
          form={form}
          onFinish={handleAdd}
          layout="vertical"
        >
          <Form.Item name="amount" label="Miqdor" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>
          <Form.Item name="date" label="Sana" rules={[{ required: true }]}>
            <Input type="date" />
          </Form.Item>
          <Form.Item
            name="category"
            label="Kategoriya"
            rules={[{ required: true }]}
          >
            <Select
              placeholder="Kategoriyani tanlang"
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: 8,
                    }}
                  >
                    <Button
                      type="link"
                      onClick={() => setIsCategoryModalVisible(true)}
                    >
                      Yangi kategoriya qo'shish
                    </Button>
                  </div>
                </>
              )}
            >
              {categories.map((category, index) => (
                <Option key={index} value={category}>
                  {category}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="description" label="Tavsif">
            <Input />
          </Form.Item>
          <Form.Item name="paidTo" label="To'langan shaxs">
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Qo'shish
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="To'lov va mijoz ma'lumotlarini kiritish"
        open={isModalVisible}
        onOk={handleSell}
        onCancel={() => {
          setIsModalVisible(false);
          sellForm.resetFields();
        }}
      >
        <Form
          form={sellForm}
          layout="vertical"
          style={{ display: "flex", flexDirection: "column", gap: "8px" }}
        >
          <Form.Item
            label="To'lov usuli"
            name="paymentMethod"
            rules={[{ required: true, message: "To'lov usulini tanlang" }]}
          >
            <Select
              value={paymentMethod}
              onChange={(value) => setPaymentMethod(value)}
            >
              <Select.Option value="cash">Naqd</Select.Option>
              <Select.Option value="card">Plastik karta</Select.Option>
              <Select.Option value="credit">Qarz</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Promokod" name="promokodId">
            <Select
              value={paymentDiscount}
              onChange={(value) => setPaymentDiscount(value)}
            >
              <Select.Option value={null}>Promokodsiz</Select.Option>
              {promos.map((item) => (
                <Select.Option
                  disabled={item.promo_type === "product"}
                  key={item._id}
                  value={item._id}
                >
                  {item.code}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Haridor" name="selectedBuyer">
            <Select
              showSearch
              value={selectedBuyer}
              onChange={(value, option) => {
                setSelectedBuyer(value);
                setBuyerType(option.type);
                if (value) {
                  if (option.type === "client") {
                    const client = clients.find((c) => c._id === value);
                    if (client) {
                      sellForm.setFieldsValue({
                        clientName: client.name,
                        clientPhone: client.phone,
                        clientAddress: client.address,
                      });
                    }
                  } else if (option.type === "partner") {
                    const partner = uniquePartners.find((p) => p.id === value);
                    if (partner) {
                      sellForm.setFieldsValue({
                        clientName: partner.name,
                        clientPhone: "",
                        clientAddress: "Hamkor manzili yo'q",
                      });
                    }
                  }
                } else {
                  sellForm.setFieldsValue({
                    clientName: "",
                    clientPhone: "",
                    clientAddress: "",
                  });
                }
              }}
              placeholder="Haridor yoki Hamkorni tanlang"
              optionFilterProp="label" // Используем label для фильтрации
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              <Select.Option value="" label="Yangi haridor">
                Yangi haridor
              </Select.Option>
              {clients.map((client) => (
                <Select.Option
                  key={client._id}
                  value={client._id}
                  type="client"
                  label={client.name} // Явно задаём label для фильтрации
                >
                  {client.name} (Xaridor)
                </Select.Option>
              ))}
              {uniquePartners.map((partner) => (
                <Select.Option
                  key={partner.id}
                  value={partner.id}
                  type="partner"
                  label={partner.name} // Явно задаём label для фильтрации
                >
                  {partner.name} (Hamkor)
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {selectedBuyer === "" && (
            <>
              <Form.Item
                label="Mijoz ismi"
                name="clientName"
                rules={[{ required: true, message: "Mijoz ismini kiriting" }]}
              >
                <Input placeholder="Mijoz ismi" />
              </Form.Item>
              <Form.Item
                label="Telefon raqami"
                name="clientPhone"
                rules={[
                  { required: true, message: "Telefon raqamini kiriting" },
                ]}
              >
                <Input placeholder="Telefon raqami" />
              </Form.Item>
              <Form.Item
                label="Manzili"
                name="clientAddress"
                rules={[{ required: true, message: "Manzili kiriting" }]}
              >
                <Input placeholder="Manzili" />
              </Form.Item>
            </>
          )}
          {paymentMethod === "credit" && (
            <>
              <Form.Item
                label="Qarz muddati"
                name="dueDate"
                rules={[{ required: true, message: "Qarz muddatini kiriting" }]}
              >
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </Form.Item>

              <Form.Item
                label="Oldindan to'langan summa"
                name="initialPayment"
                rules={[
                  {
                    type: "number",
                    min: 0,
                    message: "To'lov 0 dan kichik bo'lmasligi kerak",
                  },
                ]}
              >
                <InputNumber
                  placeholder="Masalan: 2000"
                  style={{ width: "100%" }}
                  min={0}
                />
              </Form.Item>
            </>
          )}
        </Form>
        <Space direction="vertical" style={{ color: "#000" }}>
          <p>
            Umumiy to'lov USD qismi:{" "}
            <strong>
              {basket
                .filter((p) => p.currency === "USD")
                .reduce((acc, item) => {
                  const quantity = convertToQuantity(item);
                  const itemPromo = promos.find(
                    (p) => p._id === item.promokodId
                  );
                  const basePrice = item.sellingPrice.value;
                  const discountedItemPrice = itemPromo
                    ? basePrice - (basePrice * itemPromo?.percent) / 100
                    : basePrice;

                  const subtotal = quantity * discountedItemPrice;

                  const globalPromo = promos.find(
                    (p) => p._id === paymentDiscount
                  );
                  const globalDiscount = globalPromo
                    ? (subtotal * globalPromo?.percent) / 100
                    : 0;

                  return acc + Number((subtotal - globalDiscount).toFixed(2));
                }, 0)}
            </strong>
          </p>
          <p>
            Umumiy to'lov UZS qismi:{" "}
            <strong>
              {basket
                .filter((p) => p.currency === "SUM")
                .reduce((acc, item) => {
                  const quantity = convertToQuantity(item);
                  const itemPromo = promos.find(
                    (p) => p._id === item.promokodId
                  );
                  const basePrice = item.sellingPrice.value;
                  const discountedItemPrice = itemPromo
                    ? basePrice - (basePrice * itemPromo?.percent) / 100
                    : basePrice;

                  const subtotal = quantity * discountedItemPrice;

                  const globalPromo = promos.find(
                    (p) => p._id === paymentDiscount
                  );
                  const globalDiscount = globalPromo
                    ? (subtotal * globalPromo?.percent) / 100
                    : 0;

                  return acc + Number((subtotal - globalDiscount).toFixed(2));
                }, 0)}
            </strong>
          </p>
          <p>
            Umumiy to'lov KYG qismi:{" "}
            <strong>
              {basket
                .filter((p) => p.currency === "KYG")
                .reduce((acc, item) => {
                  const quantity = convertToQuantity(item);
                  const itemPromo = promos.find(
                    (p) => p._id === item.promokodId
                  );
                  const basePrice = item.sellingPrice.value;
                  const discountedItemPrice = itemPromo
                    ? basePrice - (basePrice * itemPromo?.percent) / 100
                    : basePrice;

                  const subtotal = quantity * discountedItemPrice;

                  const globalPromo = promos.find(
                    (p) => p._id === paymentDiscount
                  );
                  const globalDiscount = globalPromo
                    ? (subtotal * globalPromo?.percent) / 100
                    : 0;

                  return acc + Number((subtotal - globalDiscount).toFixed(2));
                }, 0)}
            </strong>
          </p>
        </Space>
      </Modal>
    </div>
  );
};

export default Kassa;
