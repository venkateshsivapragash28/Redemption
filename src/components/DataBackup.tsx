import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Download, Upload, Database, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const DataBackup = () => {
  const [lastBackup, setLastBackup] = useState<string | null>(
    localStorage.getItem('last-backup-date')
  );

  const exportAllData = () => {
    try {
      const allData: Record<string, any> = {};
      
      // Export all localStorage data
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            allData[key] = JSON.parse(value);
          }
        }
      }

      const dataStr = JSON.stringify(allData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `daily-tasks-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const now = new Date().toISOString();
      localStorage.setItem('last-backup-date', now);
      setLastBackup(now);
      
      toast.success('Backup created successfully!');
    } catch (error) {
      toast.error('Failed to create backup');
      console.error('Export error:', error);
    }
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);

        // Confirm before importing
        if (confirm('This will merge the imported data with your current data. Continue?')) {
          // Clear existing data first for clean import
          Object.keys(importedData).forEach(key => {
            localStorage.setItem(key, JSON.stringify(importedData[key]));
          });
          
          toast.success('Data imported successfully! Refreshing...', { duration: 2000 });
          
          // Force a hard reload to ensure all components re-read localStorage
          setTimeout(() => {
            window.location.href = window.location.href;
          }, 1000);
        }
      } catch (error) {
        toast.error('Failed to import data. Invalid file format.');
        console.error('Import error:', error);
      }
    };
    reader.readAsText(file);
  };

  const getStorageSize = () => {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return (total / 1024).toFixed(2); // Convert to KB
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Database className="h-4 w-4 mr-2" />
          Data Backup
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Data Backup & Restore</DialogTitle>
          <DialogDescription>
            Export your data for safekeeping and import it anytime to restore.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="p-4 bg-muted/50">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm space-y-1">
                <p className="font-medium">Important Information</p>
                <p className="text-muted-foreground">
                  Your data is stored locally in your browser. Regular backups ensure you never lose your task history.
                </p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-muted-foreground mb-1">Storage Used</p>
              <p className="font-bold text-primary">{getStorageSize()} KB</p>
            </div>
            <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
              <p className="text-muted-foreground mb-1">Last Backup</p>
              <p className="font-bold text-accent">
                {lastBackup ? new Date(lastBackup).toLocaleDateString() : 'Never'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={exportAllData} 
              className="w-full"
              variant="default"
            >
              <Download className="h-4 w-4 mr-2" />
              Export All Data
            </Button>

            <div>
              <input
                type="file"
                id="import-file"
                accept=".json"
                onChange={importData}
                className="hidden"
              />
              <Button 
                onClick={() => document.getElementById('import-file')?.click()}
                className="w-full"
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Data
              </Button>
            </div>
          </div>

          <Card className="p-3 bg-success/10 border-success/20">
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
              <div className="text-success">
                <p className="font-medium">Backup Recommendations</p>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-xs">
                  <li>Export weekly for regular backups</li>
                  <li>Store backups in cloud storage (Google Drive, Dropbox)</li>
                  <li>Keep multiple backup versions</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DataBackup;
