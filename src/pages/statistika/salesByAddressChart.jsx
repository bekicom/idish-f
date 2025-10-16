import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer
} from 'recharts';

// Tooltip dizayni
const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: "white",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "5px",
                boxShadow: "0 0 5px rgba(0,0,0,0.1)"
            }}>
                <p style={{ margin: 0 }}><strong>{payload[0].payload.clientAddress}</strong></p>
                <p style={{ margin: 0 }}>Jami savdo: {payload[0].value.toLocaleString()} so'm</p>
            </div>
        );
    }
    return null;
};

// Asosiy komponent
const SalesByAddressChart = ({ sales }) => {
    // clientAddress bo‘yicha guruhlab yig‘ish
    const grouped = sales.reduce((acc, sale) => {
        const address = sale.clientAddress || 'Nomaʼlum';
        const total = sale.quantity * sale.sellingPrice;
        acc[address] = (acc[address] || 0) + total;
        return acc;
    }, {});

    // Recharts formatiga moslashtirish
    const chartData = Object.entries(grouped).map(([clientAddress, totalSale]) => ({
        clientAddress,
        totalSale
    }));

    return (
        <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="clientAddress" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="totalSale" fill="#1677ff" />
            </BarChart>
        </ResponsiveContainer>
    );
};

export default SalesByAddressChart;
