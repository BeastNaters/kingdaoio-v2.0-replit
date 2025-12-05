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
      const yearPart = parts[parts.length - 1];
      if (yearPart.length === 2) {
        const year = parseInt(yearPart);
        return year >= 0 && year <= 30 ? `20${yearPart}` : `19${yearPart}`;
      }
      return yearPart.length === 4 ? yearPart : `20${yearPart}`;
    }
    if (rawDate.includes('-')) {
      return rawDate.split('-')[0];
    }
  }
  const match = formattedDate.match(/\d{4}/);
  if (match) return match[0];
  return new Date().getFullYear().toString();
}

function getMonthFromDate(rawDate: string | undefined): string {
  if (!rawDate) return '';
  
  let month: number;
  if (rawDate.includes('/')) {
    month = parseInt(rawDate.split('/')[0]);
  } else if (rawDate.includes('-')) {
    month = parseInt(rawDate.split('-')[1]);
  } else {
    return '';
  }
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[month - 1] || '';
}

function formatYAxisValue(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}k`;
  }
  return `$${value}`;
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  const [selectedYear, setSelectedYear] = useState<string>('all');

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    if (selectedYear === 'all') {
      return data.map(item => ({
        ...item,
        monthLabel: getMonthFromDate(item.rawDate)
      }));
    }
    
    return data
      .filter(item => {
        const year = extractYear(item.rawDate, item.date);
        return year === selectedYear;
      })
      .map(item => ({
        ...item,
        monthLabel: getMonthFromDate(item.rawDate)
      }));
  }, [data, selectedYear]);

  const displayYears = ['all', '2023', '2024', '2025'];

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

  const maxValue = Math.max(...filteredData.map(d => d.value), 0);
  const yAxisDomain = [0, Math.ceil(maxValue * 1.1)];

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
                {year === 'all' ? 'All' : year}
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
              dataKey="monthLabel"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              interval="preserveStartEnd"
              tickMargin={8}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              domain={yAxisDomain}
              tickFormatter={formatYAxisValue}
              width={70}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
              labelFormatter={(label, payload) => {
                if (payload && payload[0]?.payload?.date) {
                  return payload[0].payload.date;
                }
                return label;
              }}
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
