import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ArrowRight, Users, Settings } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import PermissionRequestsSection from '@/components/PermissionRequestsSection';
import FamilyMembersListWithPermissions from '@/components/FamilyMembersListWithPermissions';

const FamilyManagementPage = () => {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              ניהול הרשאות בני המשפחה
            </h1>
          </div>
          <p className="text-xl text-muted-foreground">
            נהל את הרשאות בני המשפחה ובקש אישורים חדשים
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                בני המשפחה
              </CardTitle>
              <CardDescription>
                צפה ונהל את רשימת בני המשפחה והרשאותיהם
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full flex items-center gap-2"
                onClick={() => navigate('/family-requests')}
              >
                צפה ברשימה
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                הגדרות הרשאות
              </CardTitle>
              <CardDescription>
                קבע הרשאות ברירת מחדל לבני משפחה חדשים
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full flex items-center gap-2"
                disabled
              >
                בקרוב
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Active Permission Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              בקשות הרשאות ממתינות
            </CardTitle>
            <CardDescription>
              בקש אישור להרשאות חדשות מבני המשפחה
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PermissionRequestsSection />
          </CardContent>
        </Card>

        {/* Family Members List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              בני המשפחה הרשומים
            </CardTitle>
            <CardDescription>
              רשימת כל בני המשפחה וסטטוס האישור שלהם
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FamilyMembersListWithPermissions />
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="flex justify-center pt-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/home')}
            className="flex items-center gap-2"
          >
            חזור לעמוד הבית
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default FamilyManagementPage;