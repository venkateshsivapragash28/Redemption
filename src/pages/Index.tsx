import { useState } from 'react';
import { Link } from 'react-router-dom';
import TaskManager from '@/components/TaskManager';
import StreakCalendar from '@/components/StreakCalendar';
import AnalyticsChart from '@/components/AnalyticsChart';
import DailyNotes from '@/components/DailyNotes';
import StatsPanel from '@/components/StatsPanel';
import DataBackup from '@/components/DataBackup';
import { CheckCircle, Target, Calendar, BarChart3, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  category: string;
  priority: 'high' | 'medium' | 'low';
  order: number;
}

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>([]);

  const handleTasksChange = (newTasks: Task[]) => {
    setTasks(newTasks);
  };

  const completionPercentage = tasks.length > 0 
    ? Math.round((tasks.filter(task => task.completed).length / tasks.length) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 pb-8">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-card/80 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 pr-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                ProductivityHub
              </h1>
              <p className="text-sm text-muted-foreground">Track your daily goals and build consistent habits</p>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
                <Link to="/analytics" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Analytics
                </Link>
              </Button>
              <DataBackup />
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Today's Progress</div>
                <div className="text-2xl font-bold text-primary">{completionPercentage}%</div>
              </div>
              <div className={`p-3 rounded-full ${
                completionPercentage >= 80 ? 'bg-success/20 text-success' :
                completionPercentage >= 50 ? 'bg-warning/20 text-warning' :
                'bg-muted text-muted-foreground'
              }`}>
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 pr-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Task Manager - Takes full width on mobile, 2 columns on large screens */}
          <div className="lg:col-span-2">
            <TaskManager onTasksChange={handleTasksChange} />
          </div>

          {/* Right Sidebar */}
          <div className="space-y-8">
            <StreakCalendar />
            <DailyNotes />
          </div>
        </div>

        {/* Analytics Section - Full width */}
        <div className="mt-8 space-y-8">
          <StatsPanel />
          <AnalyticsChart />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/50 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-6 pr-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Track daily habits</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span>Monitor progress</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span>Achieve goals</span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Built for personal productivity
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
