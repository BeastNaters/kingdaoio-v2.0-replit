import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DcaPerformanceChartProps {
  data: Array<{
    date: string;
    value: number;
  }>;
  isLoading?: boolean;
}

export function DcaPerformanceChart({ data, isLoading }: DcaPerformanceChartProps) {
  if (isLoading) {
    return (
      <Card className="rounded-2xl border border-white/10 bg-card/50 backdrop-blur-xl p-6" data-testid="card-dca-performance-chart">
        <h3 className="text-lg font-semibold mb-4 font-heading">DCA Portfolio Performance</h3>
        <Skeleton className="h-64 w-full" />
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="rounded-2xl border border-white/10 bg-card/50 backdrop-blur-xl p-6" data-testid="card-dca-performance-chart">
        <h3 className="text-lg font-semibold mb-4 font-heading">DCA Portfolio Performance</h3>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          No historical data available
        </div>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border border-white/10 bg-card/50 backdrop-blur-xl p-6" data-testid="card-dca-performance-chart">
      <h3 className="text-lg font-semibold mb-4 font-heading">DCA Portfolio Performance</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorDcaValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
          <XAxis
            dataKey="date"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.5rem',
            }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--accent))"
            strokeWidth={2}
            fill="url(#colorDcaValue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
