import React, { useState, useRef, useEffect } from "react";
import {
  Table,
  Button,
  Form,
  Input,
  Select,
  Modal,
  message,
  Popconfirm,
  Upload,
  Switch,
  Space,
  AutoComplete,
  Popover,
  InputNumber,
  notification,
} from "antd";
import { useReactToPrint } from "react-to-print";
import Barcode from "react-barcode";
import {
  useAddProductMutation,
  useDeleteProductMutation,
  useGetProductsQuery,
  useRemoveDiscountForProductMutation,
  useSetDiscountForProductMutation,
  useUpdateProductMutation,
} from "../../context/service/product.service";
import {
  useGetProductsPartnerQuery,
  useDeleteProductPartnerMutation,
  useUpdateProductPartnerMutation,
} from "../../context/service/partner.service";
import { useGetWarehousesQuery } from "../../context/service/ombor.service";
import { MdEdit, MdDeleteForever, MdPrint } from "react-icons/md";
import axios from "axios";
import { FaUpload, FaList, FaPercent } from "react-icons/fa";
import "./product.css";
import {
  useCreateActPartnerMutation,
  useGetActPartnersQuery,
  useUpdateActPartnerMutation,
} from "../../context/service/act-partner.service";
import { TbRosetteDiscountOff, TbRosetteDiscount } from "react-icons/tb";

const { Option } = Select;

const generateBarcode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const BarcodePrint = React.forwardRef(({ barcode }, ref) => (
  <div ref={ref} style={{ width: "4cm", height: "3cm" }}>
    <Barcode value={barcode} width={1.5} height={50} fontSize={10} />
  </div>
));

const Product = () => {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingSource, setEditingSource] = useState("");
  const { data: products = [], isLoading: productsLoading } =
    useGetProductsQuery();
  const { data: partnerProducts = [], isLoading: partnerProductsLoading } =
    useGetProductsPartnerQuery();
  const { data: warehouses = [], isLoading: warehousesLoading } =
    useGetWarehousesQuery();
  const [addProduct] = useAddProductMutation();
  const { data: partnersFromApi = [] } = useGetActPartnersQuery();
  const [deleteProduct] = useDeleteProductMutation();
  const [deleteProductPartner] = useDeleteProductPartnerMutation();
  const [editProduct] = useUpdateProductMutation();
  const [editProductPartner] = useUpdateProductPartnerMutation();
  const [currentBarcode, setCurrentBarcode] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [isPackage, setIsPackage] = useState(true);
  const [searchName, setSearchName] = useState("");

  const [partnerModal, setParnerModal] = useState(false);
  const [partnerForm] = Form.useForm();
  const [createPartner] = useCreateActPartnerMutation();
  const [editPartner] = useUpdateActPartnerMutation();
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [isNewPartner, setIsNewPartner] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupModalVisible, setGroupModalVisible] = useState(false);
  const [productState, setProductsState] = useState("all");
  const [setDiscountForProducts] = useSetDiscountForProductMutation();
  const [removeDiscountForProducts] = useRemoveDiscountForProductMutation();

  const allProducts = [
    ...products.map((product) => ({
      ...product,
      source: "product",
      name: product.name || "Noma'lum",
      barcode: product.barcode || "",
      name_partner: product.name_partner || "",
      partner_number: product.partner_number || "",
    })),
  ];

  const barchaMahsulotlar = [
    ...products.map((mahsulot) => ({
      ...mahsulot,
      manba: "mahsulot",
      hamkor_nomi: mahsulot.name_partner || "",
      hamkor_raqami: mahsulot.partner_number || "",
      hamkor_manzili: mahsulot.partner_address || "",
    })),
    ...partnerProducts.map((mahsulot) => ({
      ...mahsulot,
      manba: "hamkor",
      hamkor_nomi: mahsulot.name_partner || "",
      hamkor_raqami: mahsulot.partner_number || "",
      hamkor_manzili: mahsulot.partner_address || "",
    })),
  ];

  const unikalHamkorlar = Array.from(
    new Map(
      barchaMahsulotlar
        .filter((p) => p.hamkor_nomi && p.hamkor_raqami)
        .map((p) => [
          p.hamkor_nomi,
          {
            nom: p.hamkor_nomi,
            raqam: p.hamkor_raqami,
            manzil: p.hamkor_manzili,
          },
        ])
    ).values()
  );

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("key", "65384e0beb6c45b817d791e806199b7e");

    try {
      const response = await axios.post(
        "https://api.imgbb.com/1/upload",
        formData
      );
      const url = response.data.data.url;
      setImageUrl(url);
      message.success("Rasm muvaffaqiyatli yuklandi!");
    } catch (error) {
      console.error("Yuklashda xatolik:", error);
      message.error("Rasmni yuklashda xatolik yuz berdi.");
    }
  };

  const printRef = useRef();

  useEffect(() => {
    if (currentBarcode) {
      handlePrint();
    }
  }, [currentBarcode]);

  const handleAddProduct = () => {
    setModalVisible(true);
    setEditingSource("product");
  };

  const handleCancel = () => {
    setModalVisible(false);
    setImageUrl("");
    setEditingSource("");

    form.resetFields();
  };

  const handleImageModalCancel = () => {
    setImageModalVisible(false);
    setSelectedImage("");
  };

  const onFinish = async (values) => {
    try {
      if (!editingProduct) {
        const partnerData = await partnersFromApi.find(
          (p) =>
            p.partner_number?.toLowerCase() ===
            localStorage.getItem("selectedPartner")?.toLowerCase()
        );

        values.name_partner = partnerData.partner_name;
        values.partner_number = partnerData.partner_number;
        values.partner_address = partnerData.partner_address;
        values.part = localStorage.getItem("selectedPartiya");
      }
      if (localStorage.getItem("role") === "warehouse") {
        values.warehouse = localStorage.getItem("_id");
      }
      if (!editingProduct) {
        const newBarcode = generateBarcode();
        values.barcode = newBarcode;
        values.isPackage = isPackage;
      }
      values.image_url = imageUrl || "";

      if (values.total_kg) {
        const total_kg = Number(values.total_kg)?.toFixed(2);
        values.kg_per_box = values.box_quantity
          ? (total_kg / Number(values.box_quantity))?.toFixed(2)
          : null;
        values.kg_per_package =
          isPackage && values.package_quantity
            ? (total_kg / Number(values.package_quantity))?.toFixed(2)
            : null;
        values.kg_per_quantity = values.quantity
          ? (total_kg / Number(values.quantity))?.toFixed(2)
          : null;
      }

      if (editingProduct) {
        if (editingSource === "product") {
          await editProduct({
            id: editingProduct._id,
            data: values,
          }).unwrap();
          message.success("Mahsulot muvaffaqiyatli tahrirlandi!");
        } else if (editingSource === "partner") {
          await editProductPartner({
            id: editingProduct._id,
            data: values,
          }).unwrap();
          message.success("Mahsulot muvaffaqiyatli tahrirlandi!");
        }
      } else {
        await addProduct(values).unwrap();
        message.success("Mahsulot muvaffaqiyatli qo'shildi!");
      }
      form.resetFields();
      setEditingProduct("");
      setEditingSource("");
      setImageUrl("");
    } catch (error) {
      if (
        error.data?.message?.includes("E11000 duplicate key error collection")
      ) {
        message.error("Barcode must be unique");
      } else {
        message.error("Mahsulotni qo'shishda xatolik yuz berdi!");
        console.error("Error:", error);
      }
    }
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    onAfterPrint: () => setCurrentBarcode(""),
  });

  const handleDelete = async (id, source) => {
    if (source === "product") {
      await deleteProduct(id);
    } else if (source === "partner") {
      await deleteProductPartner(id);
    }
  };

  const columns = [
    {
      title: "Tovar",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {record.image_url ? (
            <img
              src={record.image_url}
              alt={record.name}
              className="table-product-image"
              onClick={() => {
                setSelectedImage(record.image_url);
                setImageModalVisible(true);
              }}
            />
          ) : (
            <div
              className="table-no-image"
              onClick={() => {
                setSelectedImage("");
                setImageModalVisible(true);
              }}
            >
              -
            </div>
          )}
          <span>{record.name}</span>
        </div>
      ),
      width: 200,
    },
    {
      title: "Kategoriya",
      dataIndex: "category",
      key: "category",
      width: 120,
    },
    {
      title: "Kod",
      dataIndex: "code",
      key: "code",

      width: 80,
    },
    {
      title: "O'lcham",
      dataIndex: "size",
      key: "size",
      width: 80,
    },
    {
      title: "Pachka",
      key: "package_quantity",
      render: (_, record) =>
        record?.isPackage ? record?.package_quantity?.toFixed(2) || "-" : "-",
      align: "center",
      width: 80,
    },
    {
      title: "Karobka",
      dataIndex: "box_quantity",
      key: "box_quantity",
      render: (text) => (text ? text?.toFixed(2) : "-"),
      align: "center",
      width: 80,
    },
    {
      title: "Valyuta",
      dataIndex: "currency",
      key: "currency",
      width: 80,
    },
    {
      title: "Sotish",
      dataIndex: "sellingPrice",
      key: "sellingPrice",
      render: (text, record) => `${record.sellingPrice?.value || "-"}`,
      align: "center",
      width: 100,
    },
    {
      title: "Ombor",
      dataIndex: "warehouse",
      key: "warehouse",
      render: (text, record) => record?.warehouse?.name || "-",
      width: 120,
    },
    ...(localStorage.getItem("role") !== "warehouse"
      ? [
          {
            title: "Amallar",
            render: (_, record) => (
              <Space direction="horizontal" size={4}>
                <Button
                  type="link"
                  size="small"
                  onClick={() => {
                    setEditingProduct(record);
                    setEditingSource(record.source);
                    form.setFieldsValue({
                      ...record,
                      package_quantity: record.package_quantity?.toFixed(2),
                      box_quantity: record.box_quantity?.toFixed(2),
                    });
                    setImageUrl(record.image_url);
                    setModalVisible(true);
                  }}
                >
                  <MdEdit />
                </Button>
                <Popconfirm
                  title="O'chirishni tasdiqlaysizmi?"
                  onConfirm={() => handleDelete(record._id, record.source)}
                  okText="Ha"
                  cancelText="Yo'q"
                >
                  <Button
                    type="link"
                    size="small"
                    danger
                    style={{ color: "red" }}
                  >
                    <MdDeleteForever />
                  </Button>
                </Popconfirm>
                <Button
                  type="link"
                  size="small"
                  onClick={() => setCurrentBarcode(record.barcode)}
                >
                  <MdPrint />
                </Button>
              </Space>
            ),
            align: "center",
            width: 100,
          },
        ]
      : []),
  ];

  const filteredProducts = allProducts.filter((product) => {
    const name = (product.name || "")?.toLowerCase();

    const code = (product.code || "")?.toLowerCase();
    const category = (product.category || "")?.toLowerCase();
    const size = (product.size || "")?.toLowerCase();
    const searchNameLower = searchName?.toLowerCase();

    return (
      (searchName ? name.includes(searchNameLower) : true) ||
      (searchName ? code.includes(searchNameLower) : true) ||
      (searchName ? category.includes(searchNameLower) : true) ||
      (searchName ? size.includes(searchNameLower) : true)
    );
  });

  const handlePartnerChange = (value) => {
    if (value === "new") {
      setIsNewPartner(true);
      setSelectedPartner(null);
      partnerForm.setFieldsValue({
        partner_number: "",
        partner_address: "",
        part: "",
      });
    } else {
      const partner = partnersFromApi.find(
        (p) => p.partner_name?.toLowerCase() === value?.toLowerCase()
      );
      if (partner) {
        setSelectedPartner(partner);
        setIsNewPartner(false);
        partnerForm.setFieldsValue({
          partner_number: partner.partner_number,
          partner_address: partner.partner_address,
          part: "",
        });
      }
    }
  };

  const validatePart = (_, value) => {
    if (!value || !selectedPartner) return Promise.resolve();

    const inputPart = value?.toLowerCase();
    const existingParts = selectedPartner.parts || [];

    const isDuplicate = existingParts.some(
      (p) => p.part?.toLowerCase() === inputPart
    );

    return isDuplicate
      ? Promise.reject(new Error("Bu partiya avval saqlangan"))
      : Promise.resolve();
  };

  async function handlePartnerFinish(values) {
    try {
      let finalValues = { ...values };

      if (values.partner_name === "new") {
        const manualName = partnerForm.getFieldValue("manual_partner_name");
        if (!manualName) {
          return message.error("Yangi hamkor ismini kiriting");
        }
        finalValues.partner_name = manualName;
      }

      const existPartner = partnersFromApi.find(
        (p) =>
          p.partner_number?.toLowerCase() ===
          finalValues.partner_number?.toLowerCase()
      );

      if (existPartner) {
        await editPartner({
          id: existPartner._id,
          body: {
            parts: [...existPartner.parts, { part: finalValues.part }],
          },
        });
      } else {
        await createPartner({
          ...finalValues,
          parts: [{ part: finalValues.part }],
        });
      }

      localStorage.setItem("selectedPartner", finalValues.partner_number);
      localStorage.setItem("selectedPartiya", finalValues.part);
      partnerForm.resetFields();
      setParnerModal(false);
      setModalVisible(true);
    } catch (err) {
      console.log(err);
    }
  }

  const globalMap = filteredProducts.reduce((acc, p) => {
    const key = `${p.name}-${p.category}-${p.code}-${p.size}`;
    if (!acc.has(key)) {
      acc.set(key, {
        name: p.name,
        category: p.category,
        code: p.code,
        size: p.size,
        discount: p.discount,
        total_quantity: 0,
        total_package: 0,
        total_box: 0,
        isPackage: p.isPackage,
      });
    }
    const item = acc.get(key);
    item.total_quantity += p.quantity || 0;
    item.total_box += p.box_quantity || 0;
    if (p.isPackage) {
      item.total_package += p.package_quantity || 0;
    }
    return acc;
  }, new Map());

  const globalProductList = Array.from(globalMap.values());

  return (
    <div className="product-container">
      <div
        className="page_header"
        style={{
          display: "flex",
          alignItems: "start",
          justifyContent: "start",
          gap: "15px",
        }}
      >
        <Space
          direction="vertical"
          style={{
            alignItems: "start",
            justifyContent: "start",
          }}
        >
          {localStorage.getItem("role") === "admin" && (
            <>
              <Button
                disabled={
                  !localStorage.getItem("selectedPartner") ||
                  !localStorage.getItem("selectedPartiya")
                }
                type="primary"
                onClick={handleAddProduct}
                size="small"
                style={{ width: "150px" }}
              >
                Tovar qo'shish
              </Button>
              <Button
                style={{ width: "147px" }}
                onClick={() => setParnerModal(true)}
                type="primary"
              >
                Hamkorlar
              </Button>
              <p style={{ fontSize: "10px" }}>
                <strong>Hamkor:</strong>{" "}
                {partnersFromApi?.find(
                  (p) =>
                    p.partner_number === localStorage.getItem("selectedPartner")
                )?.partner_name || ""}
              </p>
              <p style={{ fontSize: "10px" }}>
                <strong>Partiya:</strong>{" "}
                {localStorage.getItem("selectedPartiya") || ""}
              </p>
              <Button
                disabled={
                  !localStorage.getItem("selectedPartner") ||
                  !localStorage.getItem("selectedPartiya")
                }
                onClick={async () => {
                  try {
                    if (!window.confirm("Partiyani tugatishni tasdiqlaysizmi"))
                      return;

                    const selectedPartner =
                      localStorage.getItem("selectedPartner");
                    const selectedPartiya =
                      localStorage.getItem("selectedPartiya");

                    const partnerObj = partnersFromApi.find(
                      (p) =>
                        p.partner_number?.toLowerCase() ===
                        selectedPartner?.toLowerCase()
                    );

                    if (!partnerObj) {
                      alert("Tanlangan partner topilmadi");
                      return;
                    }

                    const updatedParts = partnerObj.parts.map((p) =>
                      p.part === selectedPartiya
                        ? { ...p, status: "inactive" }
                        : p
                    );

                    await editPartner({
                      id: partnerObj._id,
                      body: { parts: updatedParts },
                    });

                    localStorage.removeItem("selectedPartner");
                    localStorage.removeItem("selectedPartiya");
                  } catch (err) {
                    console.log(err);
                    alert("Xatolik yuz berdi");
                  }
                }}
              >
                Partiyani tugatish
              </Button>
            </>
          )}
          <div style={{ display: "flex", gap: "10px" }}>
            <Input
              placeholder="Tovar nomi"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              size="small"
              style={{ width: 150 }}
            />
            <Select
              style={{ width: 150 }}
              size="small"
              value={productState}
              onChange={(value) => setProductsState(value)}
            >
              <Option value="all">Hammasi</Option>
              <Option value="not_active">Tugagan</Option>
            </Select>
          </div>
        </Space>

        {localStorage.getItem("role") === "admin" && (
          <>
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
                  const filtered = filteredProducts.filter(
                    (p) => p.currency === currency
                  );
                  const boxSum = filtered.reduce(
                    (acc, p) => acc + p.box_quantity,
                    0
                  );
                  const totalKg = filtered.reduce(
                    (acc, p) => acc + p.total_kg,
                    0
                  );
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
          </>
        )}
      </div>
      <Table
        columns={[
          { title: "Tovar", dataIndex: "name", key: "name" },
          { title: "Kategoriya", dataIndex: "category", key: "category" },
          { title: "Kod", dataIndex: "code", key: "code" },
          { title: "O'lcham", dataIndex: "size", key: "size" },
          {
            title: "Umumiy dona",
            dataIndex: "total_quantity",
            render: (t) => t?.toFixed(2),
          },
          {
            title: "Umumiy pachka",
            dataIndex: "total_package",
            render: (_, record) =>
              record.isPackage ? record.total_package?.toFixed(2) : "-",
          },
          {
            title: "Umumiy karobka",
            dataIndex: "total_box",
            render: (t) => t?.toFixed(2),
          },
          {
            title: "Chegirma",
            dataIndex: "discount",
          },
          {
            title: "Amallar",
            render: (_, record) => (
              <Space>
                <Button
                  icon={<FaList />}
                  onClick={() => {
                    setSelectedGroup(record);
                    setGroupModalVisible(true);
                  }}
                />
                <Popover
                  trigger="click"
                  content={() => (
                    <Form
                      layout="vertical"
                      onFinish={async (values) => {
                        try {
                          await setDiscountForProducts({
                            name: record.name,
                            category: record.category,
                            code: record.code,
                            size: record.size,
                            discount: Number(values.discount),
                          });
                          notification.success({
                            message: "Chegirma o'rnatildi",
                            description: "",
                          });
                        } catch (err) {
                          console.log(err);
                          notification.error({
                            message: "Xatolik",
                            description: "",
                          });
                        }
                      }}
                    >
                      <Form.Item
                        name="discount"
                        label="Chegirma(%)"
                        rules={[{ required: true, message: "Majburiy" }]}
                      >
                        <InputNumber />
                      </Form.Item>
                      <Form.Item>
                        <Button htmlType="submit">Saqlash</Button>
                      </Form.Item>
                    </Form>
                  )}
                >
                  <Button
                    disabled={record.discount !== 0}
                    icon={<TbRosetteDiscount size={20} />}
                  />
                </Popover>
                <Button
                  onClick={async () => {
                    try {
                      await removeDiscountForProducts({
                        name: record.name,
                        category: record.category,
                        code: record.code,
                        size: record.size,
                      });
                      notification.success({
                        message: "Chegirma olib tashlandi",
                        description: "",
                      });
                    } catch (err) {
                      console.log(err);
                      notification.error({
                        message: "Xatolik",
                        description: "",
                      });
                    }
                  }}
                  disabled={record.discount === 0}
                  icon={<TbRosetteDiscountOff size={20} />}
                />
              </Space>
            ),
          },
        ]}
        dataSource={globalProductList.filter((item) =>
          productState !== "all"
            ? item.total_quantity <= 0
            : item.total_quantity > 0
        )}
        rowKey={(record) =>
          `${record.name}-${record.category}-${record.code}-${record.size}`
        }
        size="small"
        bordered
      />

      <Modal
        title={editingProduct ? "Tavar tahrirlash" : "Tavar qo'shish"}
        visible={modalVisible}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <Form
          autoComplete="off"
          form={form}
          onFinish={onFinish}
          layout="vertical"
          className="product-form"
        >
          <Form.Item
            name="name"
            label="Tovar nomi"
            rules={[{ required: true, message: "Tovar nomini kiriting!" }]}
          >
            <AutoComplete
              placeholder="Tovar nomi"
              options={Array.from(
                new Set(allProducts.map((product) => product.name))
              ).map((name) => ({ value: name }))}
              filterOption={(inputValue, option) =>
                option.value?.toLowerCase().includes(inputValue?.toLowerCase())
              }
            >
              <Input />
            </AutoComplete>
          </Form.Item>

          <Form.Item name="size" label="O'lcham">
            <Input placeholder="O'lcham" type="text" />
          </Form.Item>
          <Form.Item name="code" label="Kod">
            <Input placeholder="Kod" type="text" />
          </Form.Item>
          <Form.Item label="Tan narxi" name={["purchasePrice", "value"]}>
            <Input placeholder="Tan narxi" type="number" />
          </Form.Item>
          <Form.Item label="Sotish narxi" name={["sellingPrice", "value"]}>
            <Input placeholder="Sotish narxi" type="number" />
          </Form.Item>
          <Form.Item label="Umumiy vazn" name="total_kg">
            <Input placeholder="Umumiy vazn (kg)" type="number" />
          </Form.Item>
          <div className="product-switch">
            <span>Karobka → Dona</span>
            <Switch
              checked={isPackage}
              onChange={(checked) => setIsPackage(checked)}
            />
            <span>Karobka → Pachka → Dona</span>
          </div>
          <Form.Item label="Karobka" name="box_quantity">
            <Input
              placeholder="Karobka miqdori"
              type="number"
              onChange={(e) => {
                const boxQty = Number(e.target.value);
                const perBox = Number(
                  form.getFieldValue("package_quantity_per_box")
                );
                const perPackage = Number(
                  form.getFieldValue("quantity_per_package")
                );

                if (isPackage && perBox && perPackage) {
                  const totalPackages = boxQty * perBox;
                  const totalQuantity = totalPackages * perPackage;
                  form.setFieldsValue({
                    package_quantity: totalPackages,
                    quantity: totalQuantity,
                  });
                } else if (!isPackage && perBox) {
                  form.setFieldsValue({
                    quantity: boxQty * perBox,
                  });
                }
              }}
            />
          </Form.Item>
          <Form.Item
            label={`1 karobkadagi ${isPackage ? "pachka" : "dona"}`}
            name="package_quantity_per_box"
          >
            <Input
              placeholder={`1 karobkadagi ${isPackage ? "pachka" : "dona"}`}
              type="number"
              onChange={(e) => {
                const perBox = Number(e.target.value);
                const boxQty = Number(form.getFieldValue("box_quantity"));
                const perPackage = Number(
                  form.getFieldValue("quantity_per_package")
                );

                if (isPackage && boxQty && perPackage) {
                  const totalPackages = boxQty * perBox;
                  const totalQuantity = totalPackages * perPackage;
                  form.setFieldsValue({
                    package_quantity: totalPackages,
                    quantity: totalQuantity,
                  });
                } else if (!isPackage && boxQty) {
                  form.setFieldsValue({
                    quantity: boxQty * perBox,
                  });
                }
              }}
            />
          </Form.Item>
          <Form.Item label="Pachka" name="package_quantity">
            <Input
              disabled={!isPackage}
              placeholder="Pachka miqdori"
              type="number"
            />
          </Form.Item>
          <Form.Item label="1 pachkadagi dona" name="quantity_per_package">
            <Input
              disabled={!isPackage}
              placeholder="1 pachkadagi dona"
              type="number"
              onChange={(e) => {
                const perPackage = Number(e.target.value);
                const boxQty = Number(form.getFieldValue("box_quantity"));
                const perBox = Number(
                  form.getFieldValue("package_quantity_per_box")
                );

                if (isPackage && boxQty && perBox) {
                  const totalPackages = boxQty * perBox;
                  const totalQuantity = totalPackages * perPackage;
                  form.setFieldsValue({
                    package_quantity: totalPackages,
                    quantity: totalQuantity,
                  });
                }
              }}
            />
          </Form.Item>
          <Form.Item label="Dona" name="quantity">
            <Input placeholder="Dona miqdori" type="number" disabled />
          </Form.Item>

          <Form.Item label="Valyuta" name="currency">
            <Select placeholder="Valyuta tanlash">
              <Option value="">Keyin kiritish</Option>
              <Option value="USD">USD</Option>

              <Option value="SUM">SUM</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Ombor" name="warehouse">
            <Select
              disabled={localStorage.getItem("role") === "warehouse"}
              defaultValue={
                localStorage.getItem("role") === "warehouse"
                  ? localStorage.getItem("_id")
                  : null
              }
              placeholder="Ombor tanlash"
              loading={warehousesLoading}
            >
              {warehouses.map((warehouse) => (
                <Option key={warehouse._id} value={warehouse._id}>
                  {warehouse?.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Kategoriya" name="category">
            <AutoComplete
              placeholder="Kategoriya"
              options={Array.from(
                new Set(allProducts.map((product) => product.category))
              ).map((category) => ({ value: category }))}
              filterOption={(inputValue, option) =>
                option.value?.toLowerCase().includes(inputValue?.toLowerCase())
              }
            >
              <Input />
            </AutoComplete>
          </Form.Item>
          <Form.Item label="Barkod" name="barcode" hidden>
            <Input />
          </Form.Item>
          <Upload
            customRequest={({ file }) => handleUpload(file)}
            showUploadList={false}
          >
            <Button>
              <FaUpload /> Rasm yuklash
            </Button>
          </Upload>
          {imageUrl && (
            <div className="product-upload-preview">
              <img
                src={imageUrl}
                alt="Uploaded"
                className="product-upload-image"
              />
              <a href={imageUrl} target="_blank" rel="noopener noreferrer">
                Rasm URL
              </a>
            </div>
          )}
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {editingProduct ? "Tahrirlash" : "Qo'shish"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Tovar rasmi"
        visible={imageModalVisible}
        onCancel={handleImageModalCancel}
        footer={null}
        className="modal__image"
      >
        {selectedImage ? (
          <img src={selectedImage} alt="Enlarged" className="enlarged-image" />
        ) : (
          <div className="no-image-placeholder">Rasm yo'q</div>
        )}
      </Modal>
      <Modal
        open={partnerModal}
        footer={null}
        title="Hamkorlar"
        onCancel={() => setParnerModal(false)}
      >
        <Form
          layout="vertical"
          form={partnerForm}
          onFinish={handlePartnerFinish}
        >
          <Form.Item
            name="partner_name"
            label="Hamkor ismi"
            rules={[
              { required: true, message: "Hamkor ismi tanlanishi kerak" },
            ]}
          >
            <Select
              showSearch
              placeholder="Hamkor tanlang"
              onChange={handlePartnerChange}
              filterOption={(input, option) =>
                option.children?.toLowerCase().includes(input?.toLowerCase())
              }
            >
              <Select.Option value="new">➕ Yangi hamkor</Select.Option>
              {partnersFromApi.map((partner) => (
                <Select.Option
                  key={partner.partner_name}
                  value={partner.partner_name}
                >
                  {partner.partner_name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="manual_partner_name"
            label="Yangi hamkor ismi"
            rules={[
              {
                validator: (_, value) => {
                  if (!isNewPartner) return Promise.resolve();
                  if (value === "new")
                    return Promise.reject("“new” nomi ishlatilmasligi kerak");
                  const exists = partnersFromApi.some(
                    (p) =>
                      p.partner_name?.toLowerCase() === value?.toLowerCase()
                  );
                  if (exists)
                    return Promise.reject(
                      "Bu nomdagi hamkor allaqachon mavjud"
                    );
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input disabled={!isNewPartner} />
          </Form.Item>

          <Form.Item
            name="partner_number"
            label="Hamkor raqami"
            rules={[
              {
                validator: (_, value) => {
                  if (!isNewPartner || !value) return Promise.resolve();
                  const exists = partnersFromApi.some(
                    (p) => p.partner_number === value
                  );
                  if (exists)
                    return Promise.reject(
                      "Bu raqamdagi hamkor allaqachon mavjud"
                    );
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input disabled={!isNewPartner} />
          </Form.Item>

          <Form.Item name="partner_address" label="Hamkor manzili">
            <Input disabled={!isNewPartner} />
          </Form.Item>

          <Form.Item
            name="part"
            label="Partiya"
            rules={[
              { required: true, message: "Partiya nomi kiritilishi kerak" },
              { validator: validatePart },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item>
            <Button htmlType="submit" type="primary">
              Saqlash
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Tafsilotlar"
        open={groupModalVisible}
        onCancel={() => setGroupModalVisible(false)}
        footer={null}
        width={1000}
      >
        <Table
          columns={[
            {
              title: "Rasm",
              render: (_, record) =>
                record.image_url ? (
                  <img
                    src={record.image_url}
                    onClick={() => {
                      setImageModalVisible(true);
                      setSelectedImage(record.image_url);
                    }}
                    alt="img"
                    style={{
                      width: 40,
                      height: 40,
                      objectFit: "cover",
                      borderRadius: 4,
                    }}
                  />
                ) : (
                  "-"
                ),
              width: 60,
            },
            {
              title: "Tan narx",
              render: (_, r) => r.purchasePrice?.value || "-",
            },
            {
              title: "Sotish narx",
              render: (_, r) => {
                const price = r.sellingPrice?.value;
                const discount = r.discount || 0;

                if (typeof price !== "number") return "-";

                // Original narxni hisoblash
                const originalPrice = price / (1 - discount / 100);

                return originalPrice.toFixed(2); // yoki .toLocaleString() kerak bo‘lsa
              },
            },

            { title: "Valyuta", dataIndex: "currency" },
            {
              title: "Dona",
              dataIndex: "quantity",
              render: (t) => t?.toFixed(2),
            },
            {
              title: "Pachka",
              render: (_, r) =>
                r.isPackage ? r.package_quantity?.toFixed(2) : "-",
            },
            {
              title: "Karobka",
              dataIndex: "box_quantity",
              render: (t) => t?.toFixed(2),
            },
            {
              title: "Ombor",
              render: (_, r) => r.warehouse?.name || "-",
            },
            {
              title: "Hamkor",
              render: (_, r) => r.name_partner || "-",
            },
            {
              title: "Amallar",
              render: (_, record) => (
                <Space>
                  <Button
                    icon={<MdEdit />}
                    onClick={() => {
                      setEditingProduct(record);
                      setEditingSource(record.source);
                      form.setFieldsValue(record);
                      setImageUrl(record.image_url);
                      setModalVisible(true);
                    }}
                  />
                  <Popconfirm
                    title="O'chirishni tasdiqlaysizmi?"
                    onConfirm={() => handleDelete(record._id, record.source)}
                  >
                    <Button danger icon={<MdDeleteForever />} />
                  </Popconfirm>
                  <Button
                    icon={<MdPrint />}
                    onClick={() => setCurrentBarcode(record.barcode)}
                  />
                </Space>
              ),
            },
          ]}
          dataSource={filteredProducts.filter(
            (p) =>
              p.name === selectedGroup?.name &&
              p.category === selectedGroup?.category &&
              p.code === selectedGroup?.code &&
              p.size === selectedGroup?.size
          )}
          rowKey="_id"
          size="small"
          scroll={{ x: "max-content" }}
          pagination={false}
        />
      </Modal>

      <div style={{ display: "none" }}>
        <BarcodePrint ref={printRef} barcode={currentBarcode} />
      </div>
    </div>
  );
};

export default Product;
