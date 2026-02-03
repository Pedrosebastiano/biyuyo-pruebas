import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    RadialBarChart,
    RadialBar,
    PolarAngleAxis,
    ResponsiveContainer,
    Legend
} from "recharts";

const debtAmount = 180;
const totalCapacity = 900; // Example total to make 180 be 20%
const percentage = (debtAmount / totalCapacity) * 100;

const getColor = (percent: number) => {
    if (percent <= 20) return "#00E676"; // Green (Healthy)
    if (percent <= 35) return "#FFD600"; // Yellow (Precaution)
    return "#FF1744"; // Red (Critical)
};

const fillColor = getColor(percentage);

const data = [
    {
        name: "Deudas",
        value: percentage,
        fill: fillColor,
    },
];

interface DebtListCardProps {
    items: { name: string; amount: number }[];
}

const DebtListCard: React.FC<DebtListCardProps> = ({ items }) => {
    return (
        <div
            style={{
                background: "#D1FDFC", // Light cyan from reference image
                borderRadius: 12,
                padding: "1.5rem",
                marginTop: "1rem",
                color: "#2d509e"
            }}
        >
            <h3 className="text-xl font-bold mb-4 italic text-[#4DD0E1]">Deudas pendientes</h3>
            <div className="bg-white rounded-xl p-4">
                <ul className="space-y-1">
                    {items.map((item, index) => (
                        <li key={index} className="flex items-center text-[#29488e] font-medium">
                            <span className="text-[#29488e] mr-2 text-xl">•</span>
                            {item.name} (${item.amount})
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export function DebtRatio() {
    return (
        <Card className="border-2 shadow-sm">
            <CardHeader className="text-center pb-0">
                <CardTitle className="text-2xl font-bold text-[#2d509e]">
                    Nivel de compromiso financiero
                </CardTitle>
            </CardHeader>
            <CardContent className="pb-6">
                <div className="h-[300px] w-full relative -mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                            cx="50%"
                            cy="80%"
                            innerRadius={120}
                            outerRadius={280}
                            barSize={80}
                            data={data}
                            startAngle={180}
                            endAngle={0}
                        >
                            <PolarAngleAxis
                                type="number"
                                domain={[0, 100]}
                                angleAxisId={0}
                                tick={false}
                            />
                            <RadialBar
                                background={{ fill: '#D1FDFC' }}
                                dataKey="value"
                                cornerRadius={5}
                                label={({ cx, cy, value }) => {
                                    // Custom label positioning could be complex, sticking to simple centers for now or relying on Legend
                                    // The image has a label "20%" offset.
                                    return null;
                                }}
                            />
                            {/* Custom Label for percentage */}
                            <text
                                x="50%"
                                y="20%"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="fill-gray-500 text-sm font-medium"
                            >
                                {`${percentage.toFixed(0)}%`}
                            </text>

                            <Legend
                                iconSize={10}
                                layout="horizontal"
                                verticalAlign="bottom"
                                wrapperStyle={{ bottom: '10px' }}
                                align="center"
                                content={() => (
                                    <div className="flex items-center justify-center gap-2 mt-4">
                                        <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: fillColor }}></span>
                                        <span className="text-gray-600 font-medium">Deudas</span>
                                    </div>
                                )}
                            />
                        </RadialBarChart>
                    </ResponsiveContainer>

                    {/* Centered Total Amount */}
                    <div className="absolute top-[75%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                        <span className="text-4xl font-bold text-[#1a1a1a]">${debtAmount}</span>
                    </div>
                </div>

                <DebtListCard
                    items={[
                        { name: "Mensualidad del gimnasio", amount: 80 },
                        { name: "Cashea", amount: 100 },
                    ]}
                />
            </CardContent>
        </Card>
    );
}
