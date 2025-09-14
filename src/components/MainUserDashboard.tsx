import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Eye } from 'lucide-react';

interface FamilyMemberWithPermissions {
  id: string;
  full_name: string;
  relationship_label: string;
  email: string;
  status: string;
  phone?: string;
  gender: string;
  created_at: string;
  pending_requests_count: number;
  approved_permissions_count: number;
}

const MainUserDashboard = () => {
  const { authState } = useAuth();
  const { familyMembers, loading } = useFamilyMembers();
  const [membersWithPermissions, setMembersWithPermissions] = useState<FamilyMemberWithPermissions[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (familyMembers.length > 0) {
      loadPermissionsData();
    }
  }, [familyMembers]);

  const loadPermissionsData = async () => {
    setPermissionsLoading(true);
    try {
      const membersWithPerms = await Promise.all(
        familyMembers.map(async (member) => {
          // Get permission requests count
          const { data: permissionsData } = await supabase
            .from('family_members_permissions')
            .select('status')
            .eq('family_member_id', member.id);

          const pendingCount = permissionsData?.filter(p => p.status === 'pending').length || 0;
          const approvedCount = permissionsData?.filter(p => p.status === 'approved').length || 0;

          return {
            ...member,
            pending_requests_count: pendingCount,
            approved_permissions_count: approvedCount
          };
        })
      );

      setMembersWithPermissions(membersWithPerms);
    } catch (error) {
      console.error('Error loading permissions data:', error);
    } finally {
      setPermissionsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">פעיל</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">ממתין</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800">נדחה</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-pulse">טוען נתוני בני המשפחה...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">בני המשפחה שלי</h2>
          <p className="text-muted-foreground">
            נהל את בני המשפחה המשויכים אליך ואת ההרשאות שלהם
          </p>
        </div>
        <Button onClick={() => navigate('/family-management')} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          הוסף בן משפחה
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{familyMembers.length}</div>
              <p className="text-sm font-medium">בני משפחה רשומים</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {membersWithPermissions.filter(m => m.status === 'ACTIVE').length}
              </div>
              <p className="text-sm font-medium">פעילים</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {membersWithPermissions.reduce((sum, m) => sum + m.pending_requests_count, 0)}
              </div>
              <p className="text-sm font-medium">בקשות הרשאה פתוחות</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Family Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            רשימת בני המשפחה
          </CardTitle>
          <CardDescription>
            כל בני המשפחה המשויכים אליך וסטטוס הבקשות שלהם
          </CardDescription>
        </CardHeader>
        <CardContent>
          {membersWithPermissions.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                אין בני משפחה רשומים עדיין
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                השתמש בכפתור "הוסף בן משפחה" כדי להתחיל
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {membersWithPermissions.map((member) => (
                <div
                  key={member.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-lg">{member.full_name}</h3>
                        {getStatusBadge(member.status)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <p><strong>קשר משפחתי:</strong> {member.relationship_label}</p>
                        <p><strong>אימייל:</strong> {member.email}</p>
                        {member.phone && (
                          <p><strong>טלפון:</strong> {member.phone}</p>
                        )}
                        <p><strong>תאריך הרשמה:</strong> {formatDate(member.created_at)}</p>
                      </div>
                      <div className="flex gap-4 mt-3">
                        <span className="text-sm">
                          <strong>הרשאות מאושרות:</strong> 
                          <span className="text-green-600 mr-1">{member.approved_permissions_count}</span>
                        </span>
                        <span className="text-sm">
                          <strong>בקשות ממתינות:</strong> 
                          <span className="text-orange-600 mr-1">{member.pending_requests_count}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate('/permission-requests')}
                      >
                        <Eye className="h-4 w-4" />
                        צפה בבקשות
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MainUserDashboard;