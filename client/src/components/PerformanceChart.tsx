import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PerformanceChartProps {
  data: Array<{
    date: string;
    value: number;
    rawDate?: string;
  }>;
}

function extractYear(rawDate: string | undefined, formattedDate: string): string {
  if (rawDate) {
    if (rawDate.includes('/')) {
      const parts = rawDate.split('/');
      const yearPart = parts[2];
      if (yearPart.length === 2) {
        const year = parseInt(yearPart);
        return year >= 0 && year <= 30 ? `20${yearPart}` : `19${yearPart}`;
      }
      return yearPart;
    }
    if (rawDate.includes('-')) {
      return rawDate.split('-')[0];
    }
  }
  const match = formattedDate.match(/\d{4}/);
  if (match) return match[0];
  return new Date().getFullYear().toString();
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  const availableYears = useMemo(() => {
    if (!data || data.length === 0) return ['2023', '2024', '2025'];
    const years = new Set<string>();
    data.forEach(item => {
      const year = extractYear(item.rawDate, item.date);
      years.add(year);
    });
    return Array.from(years).sort();
  }, [data]);

  const [selectedYear, setSelectedYear] = useState<string>(
    availableYears.includes('2025') ? '2025' : availableYears[availableYears.length - 1] || '2025'
  );

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.filter(item => {
      const year = extractYear(item.rawDate, item.date);
      return year === selectedYear;
    });
  }, [data, selectedYear]);

  const displayYears = ['2023', '2024', '2025'];

  if (!data || data.length === 0) {
    return (
      <Card className="rounded-2xl border border-white/10 bg-card/50 backdrop-blur-xl p-6" data-testid="card-performance-chart">
        <h3 className="text-lg font-semibold mb-4 font-heading">Treasury Performance</h3>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          No historical data available
        </div>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border border-white/10 bg-card/50 backdrop-blur-xl p-6" data-testid="card-performance-chart">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold font-heading">Treasury Performance</h3>
        <Tabs value={selectedYear} onValueChange={setSelectedYear}>
          <TabsList className="h-8">
            {displayYears.map(year => (
              <TabsTrigger
                key={year}
                value={year}
                className="text-xs px-3 h-7"
                data-testid={`tab-treasury-${year}`}
              >
                {year}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      {filteredData.length === 0 ? (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          No data available for {selectedYear}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
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
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
