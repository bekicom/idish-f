import React, { useState } from "react";
import {
  Table,
  Button,
  Form,
  Input,
  Modal,
  message,
  Popconfirm,
  Select,
} from "antd";
import { MdEdit, MdDeleteForever } from "react-icons/md";
import {
  useCreatePromoMutation,
  useDeletePromoMutation,
  useGetPromosQuery,
  useUpdatePromoMutation,
} from "../../context/service/promo.service";

export default function Promo() {
  const [form] = Form.useForm();
  const { data: promos = [] } = useGetPromosQuery();
  const [modalVisible, setModalVisible] = useState(false);
  const [currentPromo, setCurrentPromo] = useState(null);
  const [addPromo] = useCreatePromoMutation();
  const [updatePromo] = useUpdatePromoMutation();
  const [deletePromo] = useDeletePromoMutation();

  const handleAddPromo = () => {
    setModalVisible(true);
    setCurrentPromo(null);
    form.setFieldsValue({ code: "", percent: "", promo_type: "" });
  };

  const handleEditPromo = (promo) => {
    setModalVisible(true);
    setCurrentPromo(promo);
    form.setFieldsValue({
      code: promo.code,
      percent: promo.percent,
      promo_type: promo.promo_type,
    });
  };

  const handleCancel = () => {
    setModalVisible(false);
    form.resetFields();
  };

  const onFinish = async (values) => {
    try {
      if (currentPromo) {
        await updatePromo({ id: currentPromo._id, ...values }).unwrap();
        message.success("Promokod yangilandi");
      } else {
        await addPromo(values).unwrap();
        message.success("Promokod qo'shildi");
      }
      form.resetFields();
      setModalVisible(false);
    } catch (error) {
      message.error("Xatolik yuz berdi");
    }
  };

  const columns = [
    {
      title: "Promokod",
      dataIndex: "code",
      key: "code",
    },
    {
      title: "Chegirma",
      dataIndex: "percent",
      key: "percent",
      render: (text) => text + "%",
    },
    {
      title: "Qo'llanishi",
      dataIndex: "promo_type",
      key: "promo_type",
      render: (text) => (text === "overall" ? "Umumiy" : "Mahsulotga"),
    },
    {
      title: "Amallar",
      render: (_, record) => (
        <div className="table_actions">
          <Button type="primary" onClick={() => handleEditPromo(record)}>
            <MdEdit />
          </Button>
          <Popconfirm
            title="Promokodni o'chirmoqchimisiz?"
            onConfirm={() => deletePromo(record._id)}
            okText="Ha"
            cancelText="Yo'q"
          >
            <Button type="primary" danger>
              <MdDeleteForever />
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Button
        type="primary"
        onClick={handleAddPromo}
        style={{ marginBottom: 16 }}
      >
        Promokod qo'shish
      </Button>

      <Table columns={columns} dataSource={promos} rowKey="_id" />

      <Modal
        title={currentPromo ? "Promokodni tahrirlash" : "Promokod qo'shish"}
        open={modalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="code"
            label="Promokod"
            rules={[{ required: true, message: "Promokodni kiriting" }]}
          >
            <Input placeholder="" />
          </Form.Item>
          <Form.Item
            name="percent"
            label="Chegirma qiymati"
            rules={[{ required: true, message: "Qiymatni kiriting" }]}
          >
            <Input type="number" placeholder="Masalan: 10" />
          </Form.Item>

          {/* <Form.Item
            name="type"
            label="Chegirma turi"
            rules={[{ required: true, message: "Chegirma turini tanlang" }]}
          >
            <Select placeholder="Promokod turi">
              <Select.Option value="percent">Foiz (%)</Select.Option>
              <Select.Option value="amount">Pul miqdori (so'm)</Select.Option>
            </Select>
          </Form.Item> */}

          <Form.Item
            name="promo_type"
            label="Qo'llanish sohasi"
            rules={[{ required: true, message: "Promokod qayerga tegishli?" }]}
          >
            <Select placeholder="Promokod qo'llanadi">
              <Select.Option value="overall">Umumiy buyurtmaga</Select.Option>
              <Select.Option value="product">Faqat mahsulotga</Select.Option>
            </Select>
          </Form.Item>

          <Button type="primary" htmlType="submit">
            {currentPromo ? "Yangilash" : "Qo'shish"}
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
