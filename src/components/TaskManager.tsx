import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Trash2, Plus, Target, History, RotateCcw, GripVertical, Filter, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  category: string;
  priority: 'high' | 'medium' | 'low';
  order: number;
}

interface SortableTaskProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onPriorityChange: (id: string, priority: 'high' | 'medium' | 'low') => void;
  isFutureDate: boolean;
}

interface TaskManagerProps {
  onTasksChange: (tasks: Task[]) => void;
}

const SortableTask = ({ task, onToggle, onDelete, onPriorityChange, isFutureDate }: SortableTaskProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-4 border-l-destructive bg-destructive/5';
      case 'medium': return 'border-l-4 border-l-warning bg-warning/5';
      case 'low': return 'border-l-4 border-l-muted-foreground bg-muted/30';
      default: return '';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'medium': return 'bg-warning/20 text-warning border-warning/30';
      case 'low': return 'bg-muted text-muted-foreground border-muted-foreground/30';
      default: return '';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border hover:shadow-md transition-all duration-200",
        getPriorityColor(task.priority),
        task.completed && "opacity-60"
      )}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <Checkbox
        checked={task.completed}
        onCheckedChange={() => onToggle(task.id)}
        disabled={isFutureDate}
        className="data-[state=checked]:bg-success data-[state=checked]:border-success"
      />
      <div className="flex-1">
        <span className={`${task.completed ? 'line-through text-muted-foreground' : ''} font-medium`}>
          {task.title}
        </span>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            {task.category}
          </span>
          <Select value={task.priority} onValueChange={(value: 'high' | 'medium' | 'low') => onPriorityChange(task.id, value)}>
            <SelectTrigger className={cn("h-6 w-20 text-xs border", getPriorityBadge(task.priority))}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{task.title}"? You can restore it from the history later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(task.id)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const TaskManager = ({ onTasksChange }: TaskManagerProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newCategory, setNewCategory] = useState('');
  const [managedCategories, setManagedCategories] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [deletedTasks, setDeletedTasks] = useState<Task[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load tasks, deleted tasks, and categories from localStorage
  useEffect(() => {
    const dateKey = selectedDate.toISOString().split('T')[0];
    const savedTasks = localStorage.getItem(`tasks-${dateKey}`);
    const savedDeletedTasks = localStorage.getItem('deleted-tasks');
    const savedCategories = localStorage.getItem('task-categories');
    
    if (savedTasks) {
      const parsedTasks = JSON.parse(savedTasks);
      // Ensure all tasks have required fields
      const validatedTasks = parsedTasks.map((task: any, index: number) => ({
        ...task,
        order: task.order !== undefined ? task.order : index,
        priority: task.priority || 'medium'
      }));
      const sortedTasks = validatedTasks.sort((a: Task, b: Task) => a.order - b.order);
      setTasks(sortedTasks);
    } else {
      // Load default tasks for new day
      const defaultTasks: Task[] = [
        { id: '1', title: 'Go to Gym', completed: false, category: 'Fitness', priority: 'high', order: 0 },
        { id: '2', title: 'Solve LeetCode Problem', completed: false, category: 'Learning', priority: 'high', order: 1 },
        { id: '3', title: 'Read Self Development Book', completed: false, category: 'Learning', priority: 'medium', order: 2 },
        { id: '4', title: 'Do Calisthenics', completed: false, category: 'Fitness', priority: 'medium', order: 3 },
        { id: '5', title: 'Practice Yoga', completed: false, category: 'Wellness', priority: 'low', order: 4 },
      ];
      setTasks(defaultTasks);
    }

    if (savedDeletedTasks) {
      setDeletedTasks(JSON.parse(savedDeletedTasks));
    }

    if (savedCategories) {
      setManagedCategories(JSON.parse(savedCategories));
    } else {
      // Set default categories
      const defaultCategories = ['Fitness', 'Learning', 'Wellness', 'Work', 'Personal'];
      setManagedCategories(defaultCategories);
      localStorage.setItem('task-categories', JSON.stringify(defaultCategories));
    }
  }, [selectedDate]);

  // Save tasks to localStorage and notify parent whenever tasks change
  useEffect(() => {
    if (tasks.length === 0) return;
    const dateKey = selectedDate.toISOString().split('T')[0];
    localStorage.setItem(`tasks-${dateKey}`, JSON.stringify(tasks));
    // Only update parent stats if viewing today
    const isToday = dateKey === new Date().toISOString().split('T')[0];
    if (isToday) {
      onTasksChange(tasks);
    }
  }, [tasks, selectedDate, onTasksChange]);

  const addTask = () => {
    if (!newTask.trim()) return;
    if (!newCategory) {
      toast.error('Please select a category');
      return;
    }
    
    const newTasksList = [...tasks, {
      id: Date.now().toString(),
      title: newTask.trim(),
      completed: false,
      category: newCategory,
      priority: newPriority,
      order: tasks.length
    }];
    
    setTasks(newTasksList);
    setNewTask('');
    setNewPriority('medium');
    setNewCategory('');
    toast.success('Task added successfully!');
  };

  const addCategory = () => {
    if (!newCategoryName.trim()) return;
    if (managedCategories.includes(newCategoryName.trim())) {
      toast.error('Category already exists');
      return;
    }
    
    const updatedCategories = [...managedCategories, newCategoryName.trim()];
    setManagedCategories(updatedCategories);
    localStorage.setItem('task-categories', JSON.stringify(updatedCategories));
    setNewCategory(newCategoryName.trim());
    setNewCategoryName('');
    setShowAddCategory(false);
    toast.success('Category created successfully!');
  };

  const deleteCategory = (categoryToDelete: string) => {
    // Check if any tasks use this category
    const tasksUsingCategory = tasks.filter(task => task.category === categoryToDelete);
    if (tasksUsingCategory.length > 0) {
      toast.error(`Cannot delete category "${categoryToDelete}" - ${tasksUsingCategory.length} task(s) are using it`);
      return;
    }

    const updatedCategories = managedCategories.filter(cat => cat !== categoryToDelete);
    setManagedCategories(updatedCategories);
    localStorage.setItem('task-categories', JSON.stringify(updatedCategories));
    toast.success('Category deleted successfully!');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id: string) => {
    const taskToDelete = tasks.find(task => task.id === id);
    if (taskToDelete) {
      // Add to deleted tasks history
      const updatedDeletedTasks = [...deletedTasks, { ...taskToDelete, deletedAt: new Date().toISOString() } as any];
      setDeletedTasks(updatedDeletedTasks);
      localStorage.setItem('deleted-tasks', JSON.stringify(updatedDeletedTasks));
      
      // Remove from current tasks and update order
      const remainingTasks = tasks.filter(task => task.id !== id).map((task, index) => ({
        ...task,
        order: index
      }));
      setTasks(remainingTasks);
      toast.success('Task deleted successfully!');
    }
  };

  const restoreTask = (taskToRestore: Task) => {
    // Remove deletedAt property if it exists
    const { deletedAt, ...cleanTask } = taskToRestore as Task & { deletedAt?: string };
    
    // Generate new ID to avoid conflicts
    const newTasksList = [...tasks, { ...cleanTask, id: Date.now().toString(), order: tasks.length }];
    setTasks(newTasksList);
    
    // Remove from deleted tasks
    const updatedDeletedTasks = deletedTasks.filter(task => task.id !== taskToRestore.id);
    setDeletedTasks(updatedDeletedTasks);
    localStorage.setItem('deleted-tasks', JSON.stringify(updatedDeletedTasks));
    
    toast.success('Task restored successfully!');
  };

  const clearDeletedHistory = () => {
    setDeletedTasks([]);
    localStorage.removeItem('deleted-tasks');
    toast.success('Deleted tasks history cleared!');
  };

  const changePriority = (id: string, priority: 'high' | 'medium' | 'low') => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, priority } : task
    ));
    toast.success('Priority updated!');
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTasks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        const reorderedTasks = arrayMove(items, oldIndex, newIndex);
        
        // Update order and auto-assign priority based on position
        return reorderedTasks.map((task, index) => {
          let newPriority = task.priority;
          
          // Top position (index 0) gets high priority
          if (index === 0) {
            newPriority = 'high';
          }
          // Bottom position (last index) gets low priority
          else if (index === reorderedTasks.length - 1) {
            newPriority = 'low';
          }
          // Middle positions keep their current priority
          
          return { ...task, order: index, priority: newPriority };
        });
      });
      toast.success('Task reordered!');
    }
  };

  const getFilteredTasks = () => {
    let filtered = [...tasks];
    
    if (filterCategory !== 'all') {
      filtered = filtered.filter(task => task.category === filterCategory);
    }
    
    if (filterPriority !== 'all') {
      filtered = filtered.filter(task => task.priority === filterPriority);
    }
    
    return filtered.sort((a, b) => a.order - b.order);
  };

  const filteredTasks = getFilteredTasks();
  const completedCount = tasks.filter(task => task.completed).length;
  const completionPercentage = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  
  const isToday = selectedDate.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
  const isFutureDate = selectedDate.toISOString().split('T')[0] > new Date().toISOString().split('T')[0];
  const currentMonth = new Date();

  return (
    <Card className="p-6 shadow-lg bg-gradient-to-br from-card via-card to-muted/20">
      <div className="flex items-center gap-2 mb-6">
        <Target className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">{isToday ? "Today's Tasks" : format(selectedDate, "MMMM d, yyyy")}</h2>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="ml-2">
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
        <div className="ml-auto flex items-center gap-3">
          <Dialog open={showHistory} onOpenChange={setShowHistory}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                <History className="h-4 w-4 mr-2" />
                History ({deletedTasks.length})
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Deleted Tasks History</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {deletedTasks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No deleted tasks</p>
                ) : (
                  deletedTasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                      <div className="flex-1">
                        <span className="font-medium">{task.title}</span>
                        <span className="ml-2 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          {task.category}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => restoreTask(task)}
                        className="text-success hover:text-success hover:bg-success/10"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
              {deletedTasks.length > 0 && (
                <div className="flex justify-between pt-4 border-t">
                  <Button variant="outline" size="sm" onClick={clearDeletedHistory}>
                    Clear History
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)}>
                    Close
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
          <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
            {completedCount}/{tasks.length} • {completionPercentage}%
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            <SelectItem value="all">All Categories</SelectItem>
            {managedCategories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task List with Drag & Drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={filteredTasks.map(task => task.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3 mb-6">
            {filteredTasks.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No tasks match your filters</p>
            ) : (
              filteredTasks.map((task) => (
                <SortableTask
                  key={task.id}
                  task={task}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                  onPriorityChange={changePriority}
                  isFutureDate={isFutureDate}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add Task Form */}
      <div className="space-y-3 border-t pt-4">
        <div className="flex gap-2">
          <Input
            placeholder="Add a new task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            className="flex-1"
          />
        </div>
        <div className="flex gap-2">
          <Select value={newPriority} onValueChange={(value: any) => setNewPriority(value)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={newCategory} onValueChange={setNewCategory}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              {managedCategories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Manage Categories</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="New category name..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                    />
                    <Button onClick={addCategory} size="sm">
                      Add
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <p className="text-sm font-medium text-muted-foreground">Existing Categories:</p>
                  {managedCategories.map(cat => (
                    <div key={cat} className="flex items-center justify-between p-2 rounded border bg-muted/30">
                      <span className="text-sm">{cat}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCategory(cat)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={addTask} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default TaskManager;
