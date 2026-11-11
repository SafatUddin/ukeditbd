"use client";

import { useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Label, Pie, PieChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { statusLabel } from "@/components/status-badge";
import { formatCompact, formatPrice } from "@/lib/format";

const revenueConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
  orders: { label: "Orders", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function RevenueChart({ data }: { data: { date: string; revenue: number; orders: number }[] }) {
  const [range, setRange] = useState("30");
  const sliced = data.slice(-Number(range));
  const total = sliced.reduce((s, d) => s + d.revenue, 0);
  const orders = sliced.reduce((s, d) => s + d.orders, 0);

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle>Revenue</CardTitle>
          <CardDescription>
            <span className="text-lg font-semibold text-foreground tabular-nums">{formatPrice(total)}</span> from {orders} orders in the last {range} days
          </CardDescription>
        </div>
        <ToggleGroup type="single" value={range} onValueChange={(v) => v && setRange(v)} variant="outline" size="sm">
          <ToggleGroupItem value="7" className="px-3">7d</ToggleGroupItem>
          <ToggleGroupItem value="30" className="px-3">30d</ToggleGroupItem>
          <ToggleGroupItem value="90" className="px-3">90d</ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <ChartContainer config={revenueConfig} className="aspect-auto h-[280px] w-full">
          <AreaChart data={sliced} margin={{ left: 4, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={28}
              tickFormatter={(v) => new Date(v).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            />
            <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={(v) => `৳${formatCompact(v)}`} />
            <ChartTooltip
              cursor={{ strokeDasharray: "4 4" }}
              content={
                <ChartTooltipContent
                  labelFormatter={(v) => new Date(v).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                  formatter={(value, name) => (
                    <div className="flex w-full justify-between gap-6">
                      <span className="text-muted-foreground">{revenueConfig[name as keyof typeof revenueConfig]?.label}</span>
                      <span className="font-mono font-medium tabular-nums">{name === "revenue" ? formatPrice(Number(value)) : value}</span>
                    </div>
                  )}
                />
              }
            />
            <Area dataKey="revenue" type="monotone" fill="url(#fillRevenue)" stroke="var(--color-revenue)" strokeWidth={2} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

const statusColors: Record<string, string> = {
  PENDING: "var(--chart-3)",
  CONFIRMED: "var(--chart-5)",
  PROCESSING: "var(--chart-1)",
  SHIPPED: "oklch(0.6 0.2 300)",
  DELIVERED: "var(--chart-2)",
  CANCELLED: "var(--chart-4)",
  REFUNDED: "oklch(0.6 0 0)",
};

export function StatusDonut({ data }: { data: { status: string; count: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const config = Object.fromEntries(data.map((d) => [d.status, { label: statusLabel(d.status), color: statusColors[d.status] }])) satisfies ChartConfig;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order pipeline</CardTitle>
        <CardDescription>All-time orders by fulfilment status</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="mx-auto aspect-square max-h-[200px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="status" hideLabel />} />
            <Pie data={data} dataKey="count" nameKey="status" innerRadius={60} outerRadius={85} strokeWidth={3} paddingAngle={2}>
              {data.map((d) => <Cell key={d.status} fill={statusColors[d.status]} />)}
              <Label
                content={({ viewBox }) =>
                  viewBox && "cx" in viewBox ? (
                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                      <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-semibold">{total}</tspan>
                      <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 20} className="fill-muted-foreground text-xs">orders</tspan>
                    </text>
                  ) : null
                }
              />
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          {data.map((d) => (
            <div key={d.status} className="flex items-center justify-between">
              <span className="flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: statusColors[d.status] }} />{statusLabel(d.status)}</span>
              <span className="font-mono tabular-nums text-muted-foreground">{d.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const catConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
  profit: { label: "Gross profit", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function CategoryChart({ data }: { data: { name: string; revenue: number; profit: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales by category</CardTitle>
        <CardDescription>Revenue vs. gross profit, last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={catConfig} className="aspect-auto h-[260px] w-full">
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 8 }}>
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={84} tick={{ fontSize: 12 }} />
            <XAxis type="number" hide />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <div className="flex w-full justify-between gap-6">
                      <span className="text-muted-foreground">{catConfig[name as keyof typeof catConfig]?.label}</span>
                      <span className="font-mono font-medium">{formatPrice(Number(value))}</span>
                    </div>
                  )}
                />
              }
            />
            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} barSize={10} />
            <Bar dataKey="profit" fill="var(--color-profit)" radius={4} barSize={10} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
