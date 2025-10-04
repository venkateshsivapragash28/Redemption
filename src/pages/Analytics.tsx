import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Calendar, Target, ArrowLeft, Award, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DayData {
  date: string;
  completionPercentage: number;
  tasksCompleted: number;
  totalTasks: number;
}

const Analytics = () => {
  const [completionTrend, setCompletionTrend] = useState<any[]>([]);
  const [dayOfWeekData, setDayOfWeekData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [priorityData, setPriorityData] = useState<any[]>([]);
  const [monthlyComparison, setMonthlyComparison] = useState<any>(null);

  useEffect(() => {
    const today = new Date();
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (29 - i));
      return date;
    });

    // Completion trend over last 30 days
    const trendData = last30Days.map(date => {
      const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const tasksData = localStorage.getItem(`tasks-${dateString}`);
      
      let completionPercentage = 0;
      let completed = 0;
      let total = 0;
      
      if (tasksData) {
        const tasks = JSON.parse(tasksData);
        completed = tasks.filter((task: any) => task.completed).length;
        total = tasks.length;
        completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      }
      
      return {
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        completion: completionPercentage,
        completed,
        total
      };
    });
    setCompletionTrend(trendData);

    // Day of week performance
    const dayOfWeekMap = new Map<number, { total: number, completed: number, count: number }>();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    last30Days.forEach(date => {
      const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const tasksData = localStorage.getItem(`tasks-${dateString}`);
      const dayOfWeek = date.getDay();
      
      if (tasksData) {
        const tasks = JSON.parse(tasksData);
        const completed = tasks.filter((task: any) => task.completed).length;
        const total = tasks.length;
        
        if (total > 0) {
          const existing = dayOfWeekMap.get(dayOfWeek) || { total: 0, completed: 0, count: 0 };
          dayOfWeekMap.set(dayOfWeek, {
            total: existing.total + total,
            completed: existing.completed + completed,
            count: existing.count + 1
          });
        }
      }
    });

    const dowData = Array.from(dayOfWeekMap.entries()).map(([day, data]) => ({
      day: dayNames[day],
      completion: Math.round((data.completed / data.total) * 100),
      avgTasks: Math.round(data.total / data.count)
    })).sort((a, b) => dayNames.indexOf(a.day) - dayNames.indexOf(b.day));
    setDayOfWeekData(dowData);

    // Category performance
    const categoryMap = new Map<string, { completed: number, total: number }>();
    
    last30Days.forEach(date => {
      const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const tasksData = localStorage.getItem(`tasks-${dateString}`);
      
      if (tasksData) {
        const tasks = JSON.parse(tasksData);
        tasks.forEach((task: any) => {
          const existing = categoryMap.get(task.category) || { completed: 0, total: 0 };
          categoryMap.set(task.category, {
            completed: existing.completed + (task.completed ? 1 : 0),
            total: existing.total + 1
          });
        });
      }
    });

    const catData = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        completion: Math.round((data.completed / data.total) * 100),
        total: data.total
      }))
      .filter(item => item.total >= 3) // Only show categories with 3+ tasks
      .sort((a, b) => b.completion - a.completion);
    setCategoryData(catData);

    // Priority distribution
    const priorityMap = new Map<string, { completed: number, total: number }>();
    
    last30Days.forEach(date => {
      const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const tasksData = localStorage.getItem(`tasks-${dateString}`);
      
      if (tasksData) {
        const tasks = JSON.parse(tasksData);
        tasks.forEach((task: any) => {
          const existing = priorityMap.get(task.priority) || { completed: 0, total: 0 };
          priorityMap.set(task.priority, {
            completed: existing.completed + (task.completed ? 1 : 0),
            total: existing.total + 1
          });
        });
      }
    });

    const priData = Array.from(priorityMap.entries()).map(([priority, data]) => ({
      name: priority.charAt(0).toUpperCase() + priority.slice(1),
      value: data.total,
      completion: Math.round((data.completed / data.total) * 100)
    }));
    setPriorityData(priData);

    // Monthly comparison (current vs previous month)
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const getMonthData = (month: number, year: number) => {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      let totalCompleted = 0;
      let totalTasks = 0;
      let perfectDays = 0;
      
      for (let d = firstDay; d <= lastDay; d.setDate(d.getDate() + 1)) {
        const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const tasksData = localStorage.getItem(`tasks-${dateString}`);
        
        if (tasksData) {
          const tasks = JSON.parse(tasksData);
          const completed = tasks.filter((task: any) => task.completed).length;
          totalCompleted += completed;
          totalTasks += tasks.length;
          if (tasks.length > 0 && completed === tasks.length) perfectDays++;
        }
      }
      
      return {
        completion: totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0,
        totalTasks,
        perfectDays
      };
    };

    const currentMonthData = getMonthData(currentMonth, currentYear);
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const prevMonthData = getMonthData(prevMonth, prevYear);
    
    setMonthlyComparison({
      current: currentMonthData,
      previous: prevMonthData,
      improvement: currentMonthData.completion - prevMonthData.completion
    });
  }, []);

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];

  const avgCompletion = completionTrend.length > 0
    ? Math.round(completionTrend.reduce((sum, d) => sum + d.completion, 0) / completionTrend.length)
    : 0;

  const bestDay = dayOfWeekData.length > 0
    ? dayOfWeekData.reduce((best, curr) => curr.completion > best.completion ? curr : best)
    : null;

  const worstDay = dayOfWeekData.length > 0
    ? dayOfWeekData.reduce((worst, curr) => curr.completion < worst.completion ? curr : worst)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 pb-8">
      <header className="border-b border-border/50 backdrop-blur-sm bg-card/80 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 pr-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Analytics Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">Deep insights into your productivity patterns</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 pr-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">30-Day Average</span>
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div className="text-3xl font-bold text-primary">{avgCompletion}%</div>
            <p className="text-xs text-muted-foreground mt-1">Overall completion rate</p>
          </Card>

          {monthlyComparison && (
            <Card className="p-6 bg-gradient-to-br from-success/10 to-success/5 border-success/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Monthly Growth</span>
                {monthlyComparison.improvement >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-success" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-destructive" />
                )}
              </div>
              <div className={`text-3xl font-bold ${monthlyComparison.improvement >= 0 ? 'text-success' : 'text-destructive'}`}>
                {monthlyComparison.improvement > 0 ? '+' : ''}{monthlyComparison.improvement}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">vs last month</p>
            </Card>
          )}

          {monthlyComparison && (
            <Card className="p-6 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Perfect Days</span>
                <Award className="h-5 w-5 text-accent" />
              </div>
              <div className="text-3xl font-bold text-accent">{monthlyComparison.current.perfectDays}</div>
              <p className="text-xs text-muted-foreground mt-1">100% completion days this month</p>
            </Card>
          )}
        </div>

        {/* Completion Trend */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            30-Day Completion Trend
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={completionTrend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="completion" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Day of Week Performance */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Performance by Day
            </h2>
            {bestDay && worstDay && (
              <div className="mb-4 space-y-2">
                <p className="text-sm text-success flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Best: <strong>{bestDay.day}</strong> ({bestDay.completion}%)
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Focus on: <strong>{worstDay.day}</strong> ({worstDay.completion}%)
                </p>
              </div>
            )}
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dayOfWeekData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="completion" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Priority Distribution */}
          {priorityData.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Task Priority Focus
              </h2>
              <div className="space-y-3 mb-4">
                {priorityData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.name} Priority</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{item.value} tasks</span>
                      <span className={`text-sm font-semibold ${
                        item.completion >= 80 ? 'text-success' : 
                        item.completion >= 50 ? 'text-warning' : 'text-muted-foreground'
                      }`}>
                        {item.completion}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {priorityData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>

        {/* Category Performance */}
        {categoryData.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Category Performance
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Which areas of your life need more attention?
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" />
                <YAxis dataKey="category" type="category" width={100} className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="completion" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Analytics;
