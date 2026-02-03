
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Dot } from "recharts";
import { SavingsGoalCard } from "./GoalCard";

const data = [
  { date: "02-28", gastos: 16, ingresos: 40 },
  { date: "03-01", gastos: 14, ingresos: 48 },
  { date: "03-02", gastos: 12, ingresos: 42 },
  { date: "03-03", gastos: 10, ingresos: 50 },
  { date: "03-04", gastos: 13, ingresos: 46 },
  { date: "03-05", gastos: 15, ingresos: 44 },
  { date: "03-06", gastos: 14, ingresos: 52 },
];

export function IncomeExpenseChart() {
  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-[#29488e] text-center">Gastos V.S Ingresos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[340px] w-full">
          <div className="text-right text-xs text-muted-foreground mb-1 mr-4">Unit: $</div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#ececec" strokeDasharray="6 6" />
              <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 13 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#888', fontSize: 13 }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value: number) => [`$${value}`, '']}
                contentStyle={{ backgroundColor: '#fff', border: '1.5px solid #e0e0e0', borderRadius: 10 }}
              />
              <Legend
                iconType="circle"
                align="center"
                verticalAlign="bottom"
                wrapperStyle={{ paddingTop: 12 }}
                payload={[
                  { value: 'Gastos', type: 'circle', color: '#6C7AF2' },
                  { value: 'Ingresos', type: 'circle', color: '#FF8A8A' },
                ]}
              />
              <Area
                type="monotone"
                dataKey="gastos"
                name="Gastos"
                stroke="#6C7AF2"
                fill="#6C7AF2"
                fillOpacity={0.15}
                strokeWidth={3}
                dot={{ stroke: '#6C7AF2', strokeWidth: 2, fill: '#fff', r: 6 }}
                activeDot={{ stroke: '#6C7AF2', strokeWidth: 3, fill: '#fff', r: 8 }}
              />
              <Area
                type="monotone"
                dataKey="ingresos"
                name="Ingresos"
                stroke="#FF8A8A"
                fill="#FF8A8A"
                fillOpacity={0.15}
                strokeWidth={3}
                dot={{ stroke: '#FF8A8A', strokeWidth: 2, fill: '#fff', r: 6 }}
                activeDot={{ stroke: '#FF8A8A', strokeWidth: 3, fill: '#fff', r: 8 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      <SavingsGoalCard goal={100} text="Promedio de gasto diario:" currency="$" />
    </Card>
  );
}
