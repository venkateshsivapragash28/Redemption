import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Flame, TrendingUp, Pencil, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface DayData {
  date: string;
  completionPercentage: number;
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
  category: string;
  priority: 'high' | 'medium' | 'low';
  order: number;
}

const StreakCalendar = () => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [calendarData, setCalendarData] = useState<DayData[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDateTasks, setSelectedDateTasks] = useState<Task[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    // Generate calendar data for the selected month
    const year = currentYear;
    const month = currentMonth;
    
    // Get first and last day of selected month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const data: DayData[] = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // Get completion data from localStorage
      const tasksData = localStorage.getItem(`tasks-${dateString}`);
      let completionPercentage = 0;
      
      if (tasksData) {
        const tasks = JSON.parse(tasksData);
        const completed = tasks.filter((task: any) => task.completed).length;
        completionPercentage = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
      }
      
      data.push({ date: dateString, completionPercentage });
    }
    
    setCalendarData(data);
    
    // Calculate streaks
    let current = 0;
    let longest = 0;
    let temp = 0;
    
    // Start from today and go backwards
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i].completionPercentage >= 100) {
        temp++;
        if (i === data.length - 1) current = temp;
      } else {
        if (i === data.length - 1) current = 0;
        longest = Math.max(longest, temp);
        temp = 0;
      }
    }
    longest = Math.max(longest, temp);
    
    setCurrentStreak(current);
    setLongestStreak(longest);
  }, [currentMonth, currentYear]);

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getMonthYearDisplay = () => {
    const date = new Date(currentYear, currentMonth, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getDayColor = (percentage: number) => {
    if (percentage === 0) return 'bg-muted border-border';
    if (percentage < 30) return 'bg-destructive/20 border-destructive/30';
    if (percentage < 60) return 'bg-warning/30 border-warning/40';
    if (percentage < 90) return 'bg-success/40 border-success/50';
    return 'bg-success border-success';
  };

  const getDayTitle = (day: DayData) => {
    const date = new Date(day.date);
    return `${date.toLocaleDateString()} - ${day.completionPercentage}% completed`;
  };

  const handleDateClick = (dateString: string) => {
    setSelectedDate(dateString);
    setIsEditing(false);
    // Load tasks for this date
    const tasksData = localStorage.getItem(`tasks-${dateString}`);
    if (tasksData) {
      setSelectedDateTasks(JSON.parse(tasksData));
    } else {
      setSelectedDateTasks([]);
    }
  };

  const handleToggleTask = (taskId: string) => {
    const updatedTasks = selectedDateTasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    setSelectedDateTasks(updatedTasks);
    if (selectedDate) {
      localStorage.setItem(`tasks-${selectedDate}`, JSON.stringify(updatedTasks));
      // Update calendar data
      setCalendarData(prev => prev.map(day => {
        if (day.date === selectedDate) {
          const completed = updatedTasks.filter(t => t.completed).length;
          const completionPercentage = updatedTasks.length > 0 ? Math.round((completed / updatedTasks.length) * 100) : 0;
          return { ...day, completionPercentage };
        }
        return day;
      }));
    }
  };

  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = selectedDateTasks.filter(task => task.id !== taskId);
    setSelectedDateTasks(updatedTasks);
    if (selectedDate) {
      localStorage.setItem(`tasks-${selectedDate}`, JSON.stringify(updatedTasks));
      toast.success('Task deleted!');
      // Update calendar data
      setCalendarData(prev => prev.map(day => {
        if (day.date === selectedDate) {
          const completed = updatedTasks.filter(t => t.completed).length;
          const completionPercentage = updatedTasks.length > 0 ? Math.round((completed / updatedTasks.length) * 100) : 0;
          return { ...day, completionPercentage };
        }
        return day;
      }));
    }
  };

  const handleAddTask = () => {
    if (!newTask.trim() || !selectedDate) return;
    
    const task: Task = {
      id: Date.now().toString(),
      title: newTask.trim(),
      completed: false,
      category: 'Custom',
      priority: 'medium',
      order: selectedDateTasks.length
    };
    
    const updatedTasks = [...selectedDateTasks, task];
    setSelectedDateTasks(updatedTasks);
    localStorage.setItem(`tasks-${selectedDate}`, JSON.stringify(updatedTasks));
    setNewTask('');
    toast.success('Task added!');
    
    // Update calendar data
    setCalendarData(prev => prev.map(day => {
      if (day.date === selectedDate) {
        const completed = updatedTasks.filter(t => t.completed).length;
        const completionPercentage = updatedTasks.length > 0 ? Math.round((completed / updatedTasks.length) * 100) : 0;
        return { ...day, completionPercentage };
      }
      return day;
    }));
  };

  return (
    <Card className="p-6 shadow-lg bg-gradient-to-br from-card via-card to-muted/20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Progress Calendar</h2>
        </div>
        <div className="flex items-center gap-2 mr-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[140px] text-center">{getMonthYearDisplay()}</span>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 rounded-lg bg-gradient-to-br from-success/10 to-success/5 border border-success/20">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Flame className="h-5 w-5 text-success" />
            <span className="text-sm font-medium text-muted-foreground">Current Streak</span>
          </div>
          <div className="text-3xl font-bold text-success">{currentStreak}</div>
          <div className="text-xs text-muted-foreground">days</div>
        </div>
        
        <div className="text-center p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Best Streak</span>
          </div>
          <div className="text-3xl font-bold text-primary">{longestStreak}</div>
          <div className="text-xs text-muted-foreground">days</div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground p-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {/* Add empty cells to align first day with correct day of week */}
        {calendarData.length > 0 && Array.from({ length: new Date(calendarData[0].date).getDay() }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        {calendarData.map((day, index) => {
          const date = new Date(day.date);
          const dayNumber = date.getDate();
          
          return (
            <div
              key={day.date}
              title={getDayTitle(day)}
              onClick={() => handleDateClick(day.date)}
              className={`
                aspect-square rounded-lg border-2 flex items-center justify-center text-sm font-medium
                hover:scale-110 transition-all duration-200 cursor-pointer
                ${getDayColor(day.completionPercentage)}
              `}
            >
              {dayNumber}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-muted border-border border"></div>
          <div className="w-3 h-3 rounded bg-destructive/20 border-destructive/30 border"></div>
          <div className="w-3 h-3 rounded bg-warning/30 border-warning/40 border"></div>
          <div className="w-3 h-3 rounded bg-success/40 border-success/50 border"></div>
          <div className="w-3 h-3 rounded bg-success border-success border"></div>
        </div>
        <span>More</span>
      </div>

      <Dialog open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1 min-w-0">
                <span className="block">
                  {selectedDate && new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
                <div className="flex flex-wrap items-center gap-4 text-sm font-normal">
                  <span className="text-muted-foreground">
                    {selectedDateTasks.filter(t => t.completed).length} / {selectedDateTasks.length} tasks completed
                  </span>
                  <span className={`font-semibold ${
                    calendarData.find(d => d.date === selectedDate)?.completionPercentage || 0 >= 80 
                      ? 'text-success' 
                      : calendarData.find(d => d.date === selectedDate)?.completionPercentage || 0 >= 50
                      ? 'text-warning'
                      : 'text-muted-foreground'
                  }`}>
                    {calendarData.find(d => d.date === selectedDate)?.completionPercentage || 0}% completion
                  </span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsEditing(!isEditing)}
                className="text-primary hover:text-primary hover:bg-primary/10 shrink-0"
              >
                <Pencil className="h-4 w-4 mr-2" />
                {isEditing ? 'Done' : 'Edit'}
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {selectedDateTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No tasks for this day
              </div>
            ) : (
              selectedDateTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => handleToggleTask(task.id)}
                    disabled={!isEditing}
                    className="data-[state=checked]:bg-success data-[state=checked]:border-success"
                  />
                  <div className="flex-1">
                    <span className={`${task.completed ? 'line-through text-muted-foreground' : ''} font-medium`}>
                      {task.title}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {task.category}
                    </span>
                  </div>
                  {isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>

          {isEditing && (
            <div className="flex gap-2 pt-4 border-t">
              <Input
                placeholder="Add a new task..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                className="flex-1"
              />
              <Button onClick={handleAddTask} className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default StreakCalendar;