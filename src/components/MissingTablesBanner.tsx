import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface MissingTablesBannerProps {
  missingTables: string[];
}

export const MissingTablesBanner = ({ missingTables }: MissingTablesBannerProps) => {
  if (missingTables.length === 0) return null;

  return (
    <Alert className="mb-4 border-yellow-500 bg-yellow-50 text-yellow-800">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="font-semibold">טבלאות נתונים חסרות</div>
        <div className="mt-1">
          נא ליצור את הטבלאות הבאות ב-Supabase Dashboard:
        </div>
        <ul className="mt-2 list-disc list-inside text-sm">
          {missingTables.map(table => (
            <li key={table}>{table}</li>
          ))}
        </ul>
        <div className="mt-2 text-sm">
          כל טבלה צריכה להכיל את העמודות המתאימות כפי שמוגדר בדוקומנטציה.
        </div>
      </AlertDescription>
    </Alert>
  );
};