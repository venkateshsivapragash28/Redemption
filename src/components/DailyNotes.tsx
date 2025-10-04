import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BookOpen, Save, CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const DailyNotes = () => {
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    const dateKey = selectedDate.toISOString().split('T')[0];
    const savedNotes = localStorage.getItem(`notes-${dateKey}`);
    setNotes(savedNotes || '');
  }, [selectedDate]);

  const handleSave = () => {
    setIsSaving(true);
    const dateKey = selectedDate.toISOString().split('T')[0];
    localStorage.setItem(`notes-${dateKey}`, notes);
    toast.success('Notes saved successfully!');
    setTimeout(() => setIsSaving(false), 500);
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <Card className="p-6 shadow-lg bg-gradient-to-br from-card via-card to-muted/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Daily Journal</h3>
        </div>
        <Button 
          onClick={handleSave} 
          size="sm"
          disabled={isSaving}
          className="bg-primary hover:bg-primary/90"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saved!' : 'Save'}
        </Button>
      </div>
      <div className="mb-6">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
              {isToday && <span className="ml-2 text-xs text-primary">(Today)</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>
      <Textarea
        placeholder="Write your thoughts, reflections, or plans for today..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="min-h-[150px] resize-none"
      />
    </Card>
  );
};

export default DailyNotes;
