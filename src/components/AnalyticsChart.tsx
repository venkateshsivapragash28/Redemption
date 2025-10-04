import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, TrendingUp, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface ChartData {
  date: string;
  percentage: number;
  formattedDate: string;
}

const AnalyticsChart = () => {
  const [timePeriod, setTimePeriod] = useState<string>('14');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [averageCompletion, setAverageCompletion] = useState(0);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');

  useEffect(() => {
    const today = new Date();
    let startDate: Date;
    let endDate: Date = today;
    let days: number;

    // Determine date range based on selection
    if (timePeriod === 'custom' && customStartDate && customEndDate) {
      startDate = customStartDate;
      endDate = customEndDate;
      days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    } else {
      days = parseInt(timePeriod);
      startDate = new Date(today);
      startDate.setDate(today.getDate() - days + 1);
    }

    const data: ChartData[] = [];
    let totalPercentage = 0;
    let daysWithData = 0;
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      // Get completion data from localStorage
      const tasksData = localStorage.getItem(`tasks-${dateString}`);
      let percentage = 0;
      
      if (tasksData) {
        const tasks = JSON.parse(tasksData);
        const completed = tasks.filter((task: any) => task.completed).length;
        percentage = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
        totalPercentage += percentage;
        daysWithData++;
      }
      
      data.push({
        date: dateString,
        percentage,
        formattedDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    
    setChartData(data);
    
    // Calculate average
    const avg = daysWithData > 0 ? Math.round(totalPercentage / daysWithData) : 0;
    setAverageCompletion(avg);
    
    // Calculate trend (compare last half with first half)
    if (data.length >= 4) {
      const halfPoint = Math.floor(data.length / 2);
      const recent = data.slice(halfPoint).reduce((sum, item) => sum + item.percentage, 0) / (data.length - halfPoint);
      const previous = data.slice(0, halfPoint).reduce((sum, item) => sum + item.percentage, 0) / halfPoint;
      
      if (recent > previous + 5) setTrend('up');
      else if (recent < previous - 5) setTrend('down');
      else setTrend('stable');
    }
  }, [timePeriod, customStartDate, customEndDate]);

  const getPeriodLabel = () => {
    if (timePeriod === 'custom' && customStartDate && customEndDate) {
      const days = Math.ceil((customEndDate.getTime() - customStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return `${days}-Day Average`;
    }
    return `${timePeriod}-Day Average`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{payload[0].payload.formattedDate}</p>
          <p className="text-primary">
            Completion: <span className="font-bold">{payload[0].value}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-success" />;
    if (trend === 'down') return <TrendingUp className="h-4 w-4 text-destructive rotate-180" />;
    return <div className="h-4 w-4 bg-muted rounded-full" />;
  };

  const getTrendText = () => {
    if (trend === 'up') return 'Trending up';
    if (trend === 'down') return 'Trending down';
    return 'Stable';
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-success';
    if (trend === 'down') return 'text-destructive';
    return 'text-muted-foreground';
  };

  return (
    <Card className="p-6 shadow-lg bg-gradient-to-br from-card via-card to-muted/20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Progress Analytics</h2>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="14">Last 14 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          {timePeriod === 'custom' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Select Dates
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="p-3 space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-2">Start Date</p>
                    <Calendar
                      mode="single"
                      selected={customStartDate}
                      onSelect={setCustomStartDate}
                      disabled={(date) => date > new Date()}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">End Date</p>
                    <Calendar
                      mode="single"
                      selected={customEndDate}
                      onSelect={setCustomEndDate}
                      disabled={(date) => date > new Date() || (customStartDate && date < customStartDate)}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <div className="text-sm font-medium text-muted-foreground mb-1">{getPeriodLabel()}</div>
          <div className="text-3xl font-bold text-primary">{averageCompletion}%</div>
        </div>
        
        <div className="text-center p-4 rounded-lg bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
          <div className="flex items-center justify-center gap-2 mb-2">
            {getTrendIcon()}
            <span className="text-sm font-medium text-muted-foreground">Trend</span>
          </div>
          <div className={`text-lg font-bold ${getTrendColor()}`}>{getTrendText()}</div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="formattedDate" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              domain={[0, 100]}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="percentage" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default AnalyticsChart;