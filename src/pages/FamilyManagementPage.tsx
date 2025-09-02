import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, Settings, Home } from 'lucide-react';
import { useFamilyProvider } from '@/providers/FamilyProvider';
import { FamilyMembersList } from '@/components/FamilyMembersList';
import { AddFamilyMemberModal } from '@/components/AddFamilyMemberModal';
import { PendingApprovals } from '@/components/PendingApprovals';
import { useGoHome } from '@/hooks/useGoHome';

const FamilyManagementPage = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { familyMembers, pendingQueue } = useFamilyProvider();
  const goHome = useGoHome();

  const approvedMembers = familyMembers.filter(member => member.status === 'APPROVED');
  const pendingMembers = familyMembers.filter(member => member.status === 'PENDING');

  return (
    <div className="min-h-screen bg-background p-4 rtl-text">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">
                ניהול המשפחה
              </h1>
            </div>
            <Button 
              variant="outline" 
              onClick={goHome}
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              חזור לדף הבית
            </Button>
          </div>
          <p className="text-lg text-muted-foreground">
            נהלו את בני המשפחה שלכם והרשאותיהם
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Family Members Section */}
          <div className="space-y-6">
            {/* Add New Member */}
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" />
                  הוסף בן משפחה חדש
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  הזמינו בן משפחה להצטרף למערכת
                </p>
                <Button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="w-full"
                  size="lg"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  שלח הזמנה
                </Button>
              </CardContent>
            </Card>

            {/* Active Family Members */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    בני משפחה פעילים ({approvedMembers.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FamilyMembersList 
                  members={approvedMembers}
                  showActions={true}
                />
              </CardContent>
            </Card>
          </div>

          {/* Pending & Management Section */}
          <div className="space-y-6">
            {/* Pending Approvals */}
            {(pendingMembers.length > 0 || pendingQueue.length > 0) && (
              <Card className="border-2 border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-700">
                    <Settings className="w-5 h-5" />
                    ממתין לאישור
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PendingApprovals 
                    pendingMembers={pendingMembers}
                    pendingItems={pendingQueue}
                  />
                </CardContent>
              </Card>
            )}

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>סטטיסטיקות</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">בני משפחה פעילים</span>
                  <span className="font-semibold text-primary">{approvedMembers.length}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">הזמנות ממתינות</span>
                  <span className="font-semibold text-orange-600">{pendingMembers.length}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">פריטים לאישור</span>
                  <span className="font-semibold text-blue-600">{pendingQueue.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Add Family Member Modal */}
        <AddFamilyMemberModal 
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default FamilyManagementPage;