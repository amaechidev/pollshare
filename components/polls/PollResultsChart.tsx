"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  option_order: number;
  vote_count: number;
}

interface PollResultsChartProps {
  options: PollOption[];
  totalVotes: number;
}

export default function PollResultsChart({
  options,
  totalVotes,
}: PollResultsChartProps) {
  // Prepare data for recharts
  const chartData = options.map((option) => ({
    name: option.option_text,
    votes: option.vote_count,
    percentage: totalVotes > 0 ? (option.vote_count / totalVotes) * 100 : 0,
  }));

  // Custom Label for Bar Chart
  const renderCustomizedLabel = (props: any) => {
    const { x, y, width, value, payload } = props;

    // Safety check
    if (!payload || value === undefined) return null;

    const percentage = payload.percentage || 0;

    return (
      <text
        x={x + width / 2}
        y={y}
        dy={-10} // Position above the bar
        fill="#8884d8"
        textAnchor="middle"
        className="text-sm"
      >
        {`${value} (${percentage.toFixed(1)}%)`}
      </text>
    );
  };

  return (
    <Card className="mt-8 shadow-lg rounded-xl">
      <CardHeader className="p-6">
        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Poll Results
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {totalVotes === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-400 text-lg">
            No votes cast yet. Be the first to vote!
          </p>
        ) : (
          <ResponsiveContainer
            width="100%"
            height={Math.max(300, options.length * 70)}
          >
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tickLine={false}
                axisLine={false}
                className="text-sm"
              />
              <Tooltip
                formatter={(value: number, name: string, props: any) => [
                  `${value} votes (${props.payload.percentage.toFixed(1)}%)`,
                  "Votes",
                ]}
              />
              <Bar dataKey="votes" fill="#8884d8" minPointSize={5}>
                <LabelList dataKey="votes" content={renderCustomizedLabel} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
