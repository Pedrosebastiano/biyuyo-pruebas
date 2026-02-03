import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Cell
} from "recharts";
import { SavingsGoalCard } from "@/components/dashboard/GoalCard";

const data = [
    { name: "Fondo actual", value: 400, color: "#9594FF" },
    { name: "Meta", value: 800, color: "#9594FF" },
];

interface MonthsGoalCardProps {
    months: number;
}

const MonthsGoalCard: React.FC<MonthsGoalCardProps> = ({ months }) => {
    return (
        <div
            style={{
                background: "#C5D3F7",
                borderRadius: 12,
                padding: "0.75rem 1.5rem",
                display: "inline-flex",
                alignItems: "center",
                color: "#29488e",
                fontWeight: 500,
                fontSize: 18,
                marginTop: "1rem",
                marginBottom: "1rem"
            }}
        >
            <span className="mr-3">Meses meta:</span>
            <div
                style={{
                    background: "white",
                    borderRadius: 8,
                    padding: "2px 12px",
                    fontWeight: 700,
                    color: "#29488e"
                }}
            >
                {months}
            </div>
        </div>
    );
};

// Custom shape to simulate cylinder top
const CylinderBar = (props: any) => {
    const { fill, x, y, width, height } = props;
    return (
        <g>
            <path d={`M${x},${y + height} v-${height} a${width / 2},${width / 6} 0 0,1 ${width},0 v${height} z`} fill={fill} />
            <ellipse cx={x + width / 2} cy={y} rx={width / 2} ry={width / 6} fill="#B4B3FF" />
        </g>
    );
};

export function EmergencyFund() {
    return (
        <Card className="border-2 shadow-sm">
            <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl font-bold text-[#2d509e]">
                    Fondo actual V.S Meta
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-start px-6">
                    <SavingsGoalCard goal={3} text="Meses de libertad estimados:" currency="" style={{ margin: "1rem 0" }} />
                    <MonthsGoalCard months={6} />
                </div>

                <div className="h-[300px] w-full mt-4 relative">
                    <div className="absolute top-0 left-0 text-xs text-muted-foreground ml-4">Unit: $</div>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            barSize={80}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#e0e0e0"
                            />
                            <XAxis
                                dataKey="name"
                                axisLine={true}
                                tickLine={false}
                                tick={{ fill: '#444', fontSize: 13 }}
                                stroke="#888"
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#666', fontSize: 12 }}
                                ticks={[0, 200, 400, 600, 800]}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{
                                    backgroundColor: "white",
                                    border: "1px solid #ddd",
                                    borderRadius: "8px",
                                }}
                                formatter={(value: number) => [`$${value}`, "Dinero"]}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="square"
                                formatter={(value) => <span style={{ color: '#444' }}>Dinero</span>}
                            />

                            <Bar
                                dataKey="value"
                                fill="#9594FF"
                                shape={<CylinderBar />}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
