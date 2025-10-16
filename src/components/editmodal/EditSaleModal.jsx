import React, { useEffect } from "react";
import { Modal, Form, InputNumber, Select, message } from "antd";
import { useUpdateSaleMutation } from "../../context/service/sales.service";

const { Option } = Select;

const EditSaleModal = ({ visible, onClose, sale }) => {
  const [form] = Form.useForm();
  const [updateSale, { isLoading }] = useUpdateSaleMutation();

  useEffect(() => {
    if (sale) {
      form.setFieldsValue({
        quantity: sale.quantity,
        sellingPrice: sale.sellingPrice,
        paymentMethod: sale.paymentMethod,
      });
    }
  }, [sale, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await updateSale({ id: sale._id, body: values }).unwrap();
      message.success("Sotuv muvaffaqiyatli yangilandi ✅");
      onClose(true); // refresh uchun true qaytaramiz
    } catch (error) {
      message.error("Yangilashda xatolik ❌");
    }
  };

  return (
    <Modal
      title="Sotuvni tahrirlash"
      open={visible}
      onCancel={() => onClose(false)}
      onOk={handleSubmit}
      confirmLoading={isLoading}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Miqdor"
          name="quantity"
          rules={[{ required: true, message: "Miqdor kiritilishi shart" }]}
        >
          <InputNumber style={{ width: "100%" }} min={1} />
        </Form.Item>

        <Form.Item
          label="Sotish narxi"
          name="sellingPrice"
          rules={[{ required: true, message: "Narx kiritilishi shart" }]}
        >
          <InputNumber style={{ width: "100%" }} min={0} />
        </Form.Item>

        <Form.Item
          label="To‘lov usuli"
          name="paymentMethod"
          rules={[{ required: true, message: "To‘lov usuli tanlanishi shart" }]}
        >
          <Select>
            <Option value="cash">Naqd</Option>
            <Option value="card">Karta</Option>
            <Option value="credit">Qarz</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditSaleModal;
