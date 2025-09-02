import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Database, Folder, Shield, Settings } from 'lucide-react';
import { OTPSecurityBanner } from '@/components/OTPSecurityBanner';

interface TableStatus {
  name: string;
  status: 'exists' | 'missing' | 'unknown';
  description: string;
}

const requiredTables: TableStatus[] = [
  {
    name: 'family_links',
    status: 'missing',
    description: 'טבלת קישורי משפחה - מכילה מידע על בני המשפחה, סטטוס והרשאות'
  },
  {
    name: 'pending_queue', 
    status: 'missing',
    description: 'תור ממתינים - פריטים הממתינים לאישור (תמונות, תזכורות וכו\')'
  },
  {
    name: 'memories',
    status: 'missing', 
    description: 'זיכרונות - תוכן מאושר (תמונות, וידאו, סיפורים)'
  },
  {
    name: 'reminders',
    status: 'missing',
    description: 'תזכורות - תזכורות למשתמש (תרופות, פגישות, אירועים)'
  },
  {
    name: 'family_permission_requests',
    status: 'missing',
    description: 'בקשות הרשאות - בקשות בני משפחה להרשאות נוספות'
  }
];

const requiredBuckets = [
  {
    name: 'memories',
    description: 'אחסון קבצי מדיה (תמונות, וידאו)',
    status: 'missing' as 'missing' | 'exists'
  }
];

export const AdminDashboard = () => {
  const projectId = 'flwfpjthwezlnmjutfnh';

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <OTPSecurityBanner />
      
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">לוח בקרה למנהל</h1>
        <p className="text-muted-foreground mt-2">
          הגדרת וניהול מסד הנתונים של Supabase
        </p>
      </div>

      {/* Database Tables Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            סטטוס טבלאות הנתונים
          </CardTitle>
          <CardDescription>
            הטבלאות הנדרשות לפעילות מלאה של המערכת
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {requiredTables.map((table) => (
            <div key={table.name} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {table.name}
                  </code>
                  <Badge 
                    variant={table.status === 'exists' ? 'default' : 'destructive'}
                  >
                    {table.status === 'exists' ? 'קיימת' : 'חסרה'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {table.description}
                </p>
              </div>
            </div>
          ))}
          
          <div className="pt-4 border-t">
            <Button asChild variant="outline" className="w-full">
              <a 
                href={`https://supabase.com/dashboard/project/${projectId}/editor`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                פתח עורך טבלאות ב-Supabase
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Storage Buckets Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            סטטוס אחסון קבצים
          </CardTitle>
          <CardDescription>
            Buckets הנדרשים לאחסון מדיה
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {requiredBuckets.map((bucket) => (
            <div key={bucket.name} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {bucket.name}
                  </code>
                  <Badge 
                    variant={bucket.status === 'exists' ? 'default' : 'destructive'}
                  >
                    {bucket.status === 'exists' ? 'קיים' : 'חסר'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {bucket.description}
                </p>
              </div>
            </div>
          ))}
          
          <div className="pt-4 border-t">
            <Button asChild variant="outline" className="w-full">
              <a 
                href={`https://supabase.com/dashboard/project/${projectId}/storage/buckets`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                פתח ניהול Storage ב-Supabase
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* RLS & Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            אבטחה והרשאות
          </CardTitle>
          <CardDescription>
            בדיקת Row Level Security ומדיניות גישה
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 border rounded-lg bg-yellow-50 border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>חשוב:</strong> לאחר יצירת הטבלאות, יש לוודא שהוגדרו מדיניות RLS 
              מתאימות לכל טבלה כדי להגן על פרטיות המשתמשים.
            </p>
          </div>
          
          <Button asChild variant="outline" className="w-full">
            <a 
              href={`https://supabase.com/dashboard/project/${projectId}/auth/policies`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              נהל מדיניות RLS
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Additional Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            הגדרות נוספות
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button asChild variant="outline" className="w-full">
            <a 
              href={`https://supabase.com/dashboard/project/${projectId}/auth/users`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              נהל משתמשים
            </a>
          </Button>
          
          <Button asChild variant="outline" className="w-full">
            <a 
              href={`https://supabase.com/dashboard/project/${projectId}/settings/api`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              מפתחות API
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};