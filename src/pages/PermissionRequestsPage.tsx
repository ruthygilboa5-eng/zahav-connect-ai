import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Shield } from 'lucide-react';
import { useAuth } from '@/providers/FixedAuthProvider';
import AppLayout from '@/components/AppLayout';
import PermissionRequestsSection from '@/components/PermissionRequestsSection';

const PermissionRequestsPage = () => {
  const navigate = useNavigate();
  const { authState } = useAuth();

  // Redirect non-main users
  if (authState.role !== 'MAIN_USER') {
    navigate('/');
    return null;
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">בקשות הרשאות ממתינות</h1>
                  <p className="text-muted-foreground">
                    כאן תוכל לאשר או לדחות בקשות הרשאות מבני המשפחה
                  </p>
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/home')}>
              <ArrowLeft className="w-4 h-4 ml-2" />
              חזור לעמוד הראשי
            </Button>
          </div>

          {/* Permission Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                בקשות הרשאות ממתינות
              </CardTitle>
              <CardDescription>
                בני המשפחה מבקשים הרשאות נוספות לפעולות במערכת
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PermissionRequestsSection />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default PermissionRequestsPage;