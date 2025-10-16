// Usd.jsx (remains largely the same, just ensuring it provides the rate)
import React, { useState, useEffect } from "react";
import { Row, Col, Input, Button, message } from "antd";
import {
  useGetUsdRateQuery,
  useUpdateUsdRateMutation,
} from "../../context/service/usd.service";

export default function Usd() {
  const { data: usdRateData, isLoading: isUsdRateLoading } =
    useGetUsdRateQuery();
  const [updateUsdRate] = useUpdateUsdRateMutation();
  const [usdRate, setUsdRate] = useState(usdRateData?.rate || 1);
  const [kgs, setKyg] = useState(usdRateData?.kgs || 1);
  useEffect(() => {
    if (usdRateData) {
      setUsdRate(usdRateData.rate);
      setKyg(usdRateData.kgs);
    }
  }, [usdRateData]);

  const handleUsdRateChange = async () => {
    try {
      await updateUsdRate({ rate: +usdRate, kgs: +kgs }).unwrap();
      message.success("USD kursi muvaffaqiyatli yangilandi!");
    } catch (error) {
      message.error("Xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
    }
  };

  let role = localStorage.getItem("role");

  return (
    <div
      className="admin-buttons"
      style={{ display: "flex", alignItems: "center", gap: "10px" }}
    >
      <p>USD</p>
      <Input
        placeholder="Bugungi USD kursini kiriting"
        value={usdRate}
        onChange={(e) => setUsdRate(e.target.value)}
        type="number"
        readOnly={role === "warehouse" || role === "store"}
      />
      <p>KGS</p>
      <Input
        placeholder="Bugungi USD kursini kiriting"
        value={kgs}
        onChange={(e) => setKyg(e.target.value)}
        type="number"
        readOnly={role === "warehouse" || role === "store"}
      />
      <Button
        style={{ marginLeft: 20 }}
        type="primary"
        onClick={handleUsdRateChange}
        disabled={role === "warehouse" || role === "store"}
      >
        Saqlash
      </Button>
    </div>
  );
}
