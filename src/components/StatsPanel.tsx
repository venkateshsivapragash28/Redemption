import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Target, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

const StatsPanel = () => {
  const [timePeriod, setTimePeriod] = useState<string>('30');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [stats, setStats] = useState({
    bestDay: { date: '', percentage: 0 },
    worstDay: { date: '', percentage: 100 },
    averageCompletion: 0,
    totalTasksCompleted: 0,
    currentMonthTasks: 0
  });

  useEffect(() => {
    calculateStats();
  }, [timePeriod, customStartDate, customEndDate]);

  const calculateStats = () => {
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
    
    let bestDay = { date: '', percentage: 0 };
    let worstDay = { date: '', percentage: 100 };
    let totalPercentage = 0;
    let daysWithData = 0;
    let totalCompleted = 0;
    let monthTasks = 0;

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      const tasksData = localStorage.getItem(`tasks-${dateString}`);
      if (tasksData) {
        const tasks = JSON.parse(tasksData);
        const completed = tasks.filter((task: any) => task.completed).length;
        const percentage = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
        
        if (tasks.length > 0) {
          daysWithData++;
          totalPercentage += percentage;
          totalCompleted += completed;
          monthTasks += tasks.length;

          if (percentage > bestDay.percentage) {
            bestDay = { date: dateString, percentage };
          }
          if (percentage < worstDay.percentage && tasks.length > 0) {
            worstDay = { date: dateString, percentage };
          }
        }
      }
    }

    const averageCompletion = daysWithData > 0 ? Math.round(totalPercentage / daysWithData) : 0;

    setStats({
      bestDay,
      worstDay: worstDay.percentage === 100 ? { date: '', percentage: 0 } : worstDay,
      averageCompletion,
      totalTasksCompleted: totalCompleted,
      currentMonthTasks: monthTasks
    });
  };

  const getPeriodLabel = () => {
    if (timePeriod === 'custom' && customStartDate && customEndDate) {
      return `${format(customStartDate, 'MMM dd')} - ${format(customEndDate, 'MMM dd')}`;
    }
    return `Last ${timePeriod} Days`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card className="p-6 shadow-lg bg-gradient-to-br from-card via-card to-muted/20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Target className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Statistics ({getPeriodLabel()})</h2>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-gradient-to-br from-success/10 to-success/5 border border-success/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-success" />
            <span className="text-sm font-medium text-muted-foreground">Best Day</span>
          </div>
          <div className="text-2xl font-bold text-success">{stats.bestDay.percentage}%</div>
          <div className="text-xs text-muted-foreground">{formatDate(stats.bestDay.date)}</div>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-br from-destructive/10 to-destructive/5 border border-destructive/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-5 w-5 text-destructive" />
            <span className="text-sm font-medium text-muted-foreground">Lowest Day</span>
          </div>
          <div className="text-2xl font-bold text-destructive">{stats.worstDay.percentage}%</div>
          <div className="text-xs text-muted-foreground">{formatDate(stats.worstDay.date)}</div>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Average Completion</span>
          </div>
          <div className="text-2xl font-bold text-primary">{stats.averageCompletion}%</div>
          <div className="text-xs text-muted-foreground">Daily average</div>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
          <div className="flex items-center gap-2 mb-2">
            <CalendarIcon className="h-5 w-5 text-accent" />
            <span className="text-sm font-medium text-muted-foreground">Tasks Completed</span>
          </div>
          <div className="text-2xl font-bold text-accent">{stats.totalTasksCompleted}</div>
          <div className="text-xs text-muted-foreground">Out of {stats.currentMonthTasks} total</div>
        </div>
      </div>
    </Card>
  );
};

export default StatsPanel;
