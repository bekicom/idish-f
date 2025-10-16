import React from "react";
import { useGetUnfinishedQuery } from "../../context/service/unfinished.service";
import { Card, Table, Checkbox } from "antd";
import moment from "moment";
function Unfinished() {
  const { data, isLoading } = useGetUnfinishedQuery();

  const stm = {
    kg_quantity: "kg",
    quantity: "dona",
    box_quantity: "karobka",
    package_quantity: "pachka",
  };
  return (
    <div>
      {data?.map((item, index) => (
        <Card
          key={index}
          title={
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{item.senderName}</span>
              <span>{moment(item.date).format("DD.MM.YYYY")}</span>
            </div>
          }
        >
          <Table
            size="small"
            columns={[
              {
                title: "Holat",
                render: (text, record) => <Checkbox checked={record.checked} />,
              },
              {
                title: "Mahsulot nomi",
                dataIndex: "name",  
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
    </div>
  );
}

export default Unfinished;
