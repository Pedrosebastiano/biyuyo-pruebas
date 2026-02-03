import { SavingsGoalCard } from "@/components/dashboard/GoalCard";

// Custom Legend to show all bars
function CustomLegend() {
  return (
    <ul style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', listStyle: 'none', margin: 0, padding: 0 }}>
      {data.map((entry) => (
        <li key={entry.name} style={{ display: 'flex', alignItems: 'center', marginRight: 16, marginBottom: 4 }}>
          <span style={{
            display: 'inline-block',
            width: 16,
            height: 16,
            backgroundColor: entry.color,
            marginRight: 6,
            borderRadius: 4,
            border: '1px solid #ccc',
          }} />
          <span style={{ color: entry.color, fontWeight: 500 }}>{entry.name}</span>
        </li>
      ))}
    </ul>
  );
}
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

// More saturated color palette (except for savings goal)
const pastelColors = [
  '#26C6DA', // cyan
  '#FF6384', // pink
  '#FFD600', // yellow
  '#7C4DFF', // purple
  '#FF8A65', // orange
  '#536DFE', // blue
  '#43A047', // green
  '#FFB300', // amber
  '#D500F9', // magenta
  '#00B8D4', // teal
  '#FF1744', // red
  '#00E676', // light green
];

const savingsGoal = 100;
const data = [
  { name: "Meta de ahorro", value: savingsGoal, color: "#bdbdbd" },
  { name: "Ene", value: 50.41, color: pastelColors[0] },
  { name: "Feb", value: 75.06, color: pastelColors[1] },
  { name: "Mar", value: 95.66, color: pastelColors[2] },
  // Add more months here if needed
];

export function MonthlySavingsChart() {
  return (
    <Card className="border-2 shadow-sm">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl font-bold text-[#2d509e]">
          Ahorros mensuales
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-right text-xs text-muted-foreground mb-1 mr-4">
          Unit: $
        </div>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              barSize={45}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                horizontal={false} 
                stroke="#e0e0e0" 
              />
              <XAxis 
                type="number" 
                orientation="top" 
                domain={[0, 100]} 
                ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#666', fontSize: 12 }}
              />
              <YAxis 
                dataKey="name" 
                type="category" 
                hide 
              />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`$${value}`, "Ahorro"]}
              />
              <Legend verticalAlign="bottom" height={36} content={<CustomLegend />} />
              
              {/* Only one Bar, each entry is a category (goal or month) */}
              <Bar
                dataKey="value"
                name="Ahorro"
                radius={[0, 25, 25, 0]}
                legendType="rect"
                label={({ x, y, width, height, value, index }) => {
                  const entry = data[index];
                  return (
                    <g>
                      <text
                        x={x + width / 2}
                        y={y + height / 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={entry.color}
                        fontSize={14}
                        fontWeight="bold"
                      >
                        {`${entry.name}: $${value}`}
                      </text>
                    </g>
                  );
                }}
              >
                {data.map((entry, index) => (
                  <Cell key={`bar-${entry.name}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>

      <SavingsGoalCard goal={100} text="Meta de ahorro:" currency="$" />
    </Card>
  );
}