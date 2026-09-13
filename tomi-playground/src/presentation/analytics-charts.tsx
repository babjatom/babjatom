import type { ReactNode } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  countryShare,
  radarMetrics,
  radialProgress,
  visitsTrend,
} from './mock-analytics'

const trendConfig = {
  desktop: { label: 'Desktop', color: 'hsl(var(--primary))' },
  mobile: { label: 'Mobile', color: 'hsl(var(--accent))' },
} satisfies ChartConfig

const pieConfig = {
  visitors: { label: 'Visitors' },
  us: { label: 'United States', color: 'hsl(var(--primary))' },
  de: { label: 'Germany', color: 'hsl(var(--accent))' },
  jp: { label: 'Japan', color: 'hsl(199 89% 48%)' },
  br: { label: 'Brazil', color: 'hsl(var(--secondary-foreground))' },
  other: { label: 'Other', color: 'hsl(var(--muted-foreground))' },
} satisfies ChartConfig

const radarConfig = {
  a: { label: 'Series A', color: 'hsl(var(--primary))' },
  b: { label: 'Series B', color: 'hsl(var(--accent))' },
} satisfies ChartConfig

const radialConfig = {
  visitors: { label: 'Visitors' },
  chrome: { label: 'Chrome', color: 'hsl(var(--primary))' },
  safari: { label: 'Safari', color: 'hsl(var(--accent))' },
  firefox: { label: 'Firefox', color: 'hsl(199 89% 48%)' },
  edge: { label: 'Edge', color: 'hsl(var(--destructive))' },
  other: { label: 'Other', color: 'hsl(var(--muted-foreground))' },
} satisfies ChartConfig

function ChartCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function AnalyticsCharts() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <ChartCard
        title="Area"
        description="Stacked area chart for desktop vs mobile visits."
      >
        <ChartContainer config={trendConfig} className="min-h-[220px] w-full">
          <AreaChart data={visitsTrend} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              dataKey="mobile"
              type="natural"
              fill="var(--color-mobile)"
              fillOpacity={0.35}
              stroke="var(--color-mobile)"
              stackId="a"
            />
            <Area
              dataKey="desktop"
              type="natural"
              fill="var(--color-desktop)"
              fillOpacity={0.45}
              stroke="var(--color-desktop)"
              stackId="a"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </ChartCard>

      <ChartCard
        title="Bar"
        description="Grouped bar chart comparing monthly traffic."
      >
        <ChartContainer config={trendConfig} className="min-h-[220px] w-full">
          <BarChart data={visitsTrend} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
            <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
            <ChartLegend content={<ChartLegendContent />} />
          </BarChart>
        </ChartContainer>
      </ChartCard>

      <ChartCard
        title="Line"
        description="Line chart with tooltip for trend inspection."
      >
        <ChartContainer config={trendConfig} className="min-h-[220px] w-full">
          <LineChart data={visitsTrend} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis tickLine={false} axisLine={false} width={32} />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Line
              dataKey="desktop"
              type="monotone"
              stroke="var(--color-desktop)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="mobile"
              type="monotone"
              stroke="var(--color-mobile)"
              strokeWidth={2}
              dot={false}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </LineChart>
        </ChartContainer>
      </ChartCard>

      <ChartCard title="Pie" description="Country share of visitors.">
        <ChartContainer
          config={pieConfig}
          className="mx-auto aspect-square max-h-[260px]"
        >
          <PieChart>
            <ChartTooltip
              content={<ChartTooltipContent nameKey="country" hideLabel />}
            />
            <Pie data={countryShare} dataKey="visitors" nameKey="country" />
            <ChartLegend
              content={<ChartLegendContent nameKey="country" />}
              className="-translate-y-2 flex-wrap gap-2"
            />
          </PieChart>
        </ChartContainer>
      </ChartCard>

      <ChartCard title="Radar" description="Engagement metrics comparison.">
        <ChartContainer
          config={radarConfig}
          className="mx-auto aspect-square max-h-[280px]"
        >
          <RadarChart data={radarMetrics}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <PolarAngleAxis dataKey="metric" />
            <PolarGrid />
            <Radar
              dataKey="a"
              fill="var(--color-a)"
              fillOpacity={0.45}
              stroke="var(--color-a)"
            />
            <Radar
              dataKey="b"
              fill="var(--color-b)"
              fillOpacity={0.25}
              stroke="var(--color-b)"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </RadarChart>
        </ChartContainer>
      </ChartCard>

      <ChartCard title="Radial" description="Browser mix as a radial bar chart.">
        <ChartContainer
          config={radialConfig}
          className="mx-auto aspect-square max-h-[280px]"
        >
          <RadialBarChart
            data={radialProgress}
            innerRadius={30}
            outerRadius={110}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey="browser" />}
            />
            <RadialBar dataKey="visitors" background />
            <ChartLegend
              content={<ChartLegendContent nameKey="browser" />}
              className="-translate-y-2 flex-wrap gap-2"
            />
          </RadialBarChart>
        </ChartContainer>
      </ChartCard>

      <ChartCard
        title="Tooltip"
        description="Dedicated tooltip demo on a compact line chart."
      >
        <ChartContainer config={trendConfig} className="min-h-[220px] w-full">
          <LineChart data={visitsTrend} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator="dashed"
                  labelFormatter={(value) => `Month: ${String(value)}`}
                />
              }
            />
            <Line
              dataKey="desktop"
              type="monotone"
              stroke="var(--color-desktop)"
              strokeWidth={2}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ChartContainer>
      </ChartCard>
    </div>
  )
}
