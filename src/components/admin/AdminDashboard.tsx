import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Users, UserPlus, AlertCircle, Eye, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { RoleManagement } from './RoleManagement';

interface AdminUser {
  user_id: string;
  first_name: string;
  last_name: string;
  display_name: string;
  email: string;
  registration_date: string;
  family_members_count: number;
  pending_requests_count: number;
}

interface FamilyMember {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  relationship: string;
  status: string;
  created_at: string;
  owner_first_name: string;
  owner_last_name: string;
  owner_email: string;
  owner_user_id: string;
}

interface PendingRequest {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  relationship: string;
  created_at: string;
  owner_first_name: string;
  owner_last_name: string;
  owner_email: string;
  owner_user_id: string;
}

interface DashboardStats {
  activeUsers: number;
  totalFamilies: number;
  pendingApprovals: number;
}

export const AdminDashboard = () => {
  const { authState } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ activeUsers: 0, totalFamilies: 0, pendingApprovals: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedUserFamily, setSelectedUserFamily] = useState<string | null>(null);

  // Check if user is admin
  const isAdmin = authState.role === 'ADMIN';

  useEffect(() => {
    if (isAdmin) {
      loadDashboardData();
    }
  }, [isAdmin]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load users summary
      const { data: usersData, error: usersError } = await supabase
        .from('user_profiles')
        .select(`
          user_id,
          first_name,
          last_name,
          display_name,
          email,
          created_at
        `);

      if (usersError) throw usersError;

      // Get family members count for each user
      const usersWithCounts = await Promise.all(
        (usersData || []).map(async (user) => {
          const { count: approvedCount } = await supabase
            .from('family_links')
            .select('*', { count: 'exact', head: true })
            .eq('owner_user_id', user.user_id)
            .eq('status', 'APPROVED');

          const { count: pendingCount } = await supabase
            .from('family_links')
            .select('*', { count: 'exact', head: true })
            .eq('owner_user_id', user.user_id)
            .eq('status', 'PENDING');

          return {
            ...user,
            registration_date: user.created_at,
            family_members_count: approvedCount || 0,
            pending_requests_count: pendingCount || 0
          };
        })
      );

      setUsers(usersWithCounts);

      // Load all family members
      const { data: familyData, error: familyError } = await supabase
        .from('family_links')
        .select('*');

      if (familyError) throw familyError;

      // Get owner profiles for each family member
      const familyWithOwners = await Promise.all(
        (familyData || []).map(async (member) => {
          const { data: ownerProfile } = await supabase
            .from('user_profiles')
            .select('first_name, last_name, email')
            .eq('user_id', member.owner_user_id)
            .single();

          return {
            id: member.id,
            full_name: member.full_name,
            email: member.email || '',
            phone: member.phone || '',
            relationship: member.relationship_to_primary_user || '',
            status: member.status,
            created_at: member.created_at,
            owner_first_name: ownerProfile?.first_name || '',
            owner_last_name: ownerProfile?.last_name || '',
            owner_email: ownerProfile?.email || '',
            owner_user_id: member.owner_user_id
          };
        })
      );

      setFamilyMembers(familyWithOwners);

      // Filter pending requests
      const pending = familyWithOwners.filter(member => member.status === 'PENDING');
      setPendingRequests(pending);

      // Calculate stats
      setStats({
        activeUsers: usersWithCounts.length,
        totalFamilies: usersWithCounts.length,
        pendingApprovals: pending.length
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בטעינת נתוני הדשבורד',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId: string, action: 'APPROVED' | 'DECLINED') => {
    try {
      const { error } = await supabase
        .from('family_links')
        .update({ status: action })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: 'הפעולה בוצעה בהצלחה',
        description: action === 'APPROVED' ? 'הבקשה אושרה' : 'הבקשה נדחתה'
      });

      // Reload data
      loadDashboardData();
    } catch (error) {
      console.error('Error updating request:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בעדכון הבקשה',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="default" className="bg-green-100 text-green-800">מאושר</Badge>;
      case 'PENDING':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">ממתין לאישור</Badge>;
      case 'DECLINED':
        return <Badge variant="destructive">נדחה</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUserFamilyMembers = (userId: string) => {
    return familyMembers.filter(member => member.owner_user_id === userId);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/admin-login');
      toast({
        title: 'התנתקת בהצלחה',
        description: 'הפגישה הופסקה בבטחה',
      });
    } catch (error) {
      console.error('Error during logout:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בהתנתקות',
        variant: 'destructive'
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center">אין הרשאת גישה</CardTitle>
            <CardDescription className="text-center">
              מסך זה מיועד למנהלי המערכת בלבד
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-pulse">טוען נתונים...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">מסך ניהול מערכת</h1>
          <p className="text-muted-foreground">ניהול משתמשים ובני משפחה</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleLogout}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          התנתק
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">משתמשים פעילים</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">משפחות רשומות</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFamilies}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">בקשות הצטרפות פתוחות</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">משתמשים ראשיים</TabsTrigger>
          <TabsTrigger value="family">בני משפחה</TabsTrigger>
          <TabsTrigger value="pending">בקשות פתוחות</TabsTrigger>
          <TabsTrigger value="permissions">ניהול הרשאות</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>משתמשים ראשיים</CardTitle>
              <CardDescription>
                רשימת כל המשתמשים הראשיים במערכת
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>שם</TableHead>
                    <TableHead>אימייל</TableHead>
                    <TableHead>תאריך הרשמה</TableHead>
                    <TableHead>מספר בני משפחה</TableHead>
                    <TableHead>בקשות פתוחות</TableHead>
                    <TableHead>פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell className="font-medium">
                        {user.first_name} {user.last_name}
                        {user.display_name && (
                          <span className="text-muted-foreground text-sm block">
                            ({user.display_name})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {format(new Date(user.registration_date), 'dd/MM/yyyy', { locale: he })}
                      </TableCell>
                      <TableCell>{user.family_members_count}</TableCell>
                      <TableCell>{user.pending_requests_count}</TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedUserFamily(
                            selectedUserFamily === user.user_id ? null : user.user_id
                          )}
                        >
                          <Eye className="h-4 w-4 ml-1" />
                          {selectedUserFamily === user.user_id ? 'הסתר' : 'הצג בני משפחה'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Family Members for Selected User */}
              {selectedUserFamily && (
                <div className="mt-6 p-4 border rounded-lg bg-muted/50">
                  <h3 className="font-semibold mb-3">
                    בני משפחה של {users.find(u => u.user_id === selectedUserFamily)?.first_name} {users.find(u => u.user_id === selectedUserFamily)?.last_name}
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>שם</TableHead>
                        <TableHead>קרבה</TableHead>
                        <TableHead>סטטוס</TableHead>
                        <TableHead>תאריך בקשה</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getUserFamilyMembers(selectedUserFamily).map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>{member.full_name}</TableCell>
                          <TableCell>{member.relationship}</TableCell>
                          <TableCell>{getStatusBadge(member.status)}</TableCell>
                          <TableCell>
                            {format(new Date(member.created_at), 'dd/MM/yyyy', { locale: he })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Family Members Tab */}
        <TabsContent value="family">
          <Card>
            <CardHeader>
              <CardTitle>כל בני המשפחה</CardTitle>
              <CardDescription>
                רשימת כל בני המשפחה במערכת לפי סטטוס
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>שם</TableHead>
                    <TableHead>אימייל</TableHead>
                    <TableHead>טלפון</TableHead>
                    <TableHead>קרבה</TableHead>
                    <TableHead>בעלים</TableHead>
                    <TableHead>סטטוס</TableHead>
                    <TableHead>תאריך יצירה</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {familyMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.full_name}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{member.phone}</TableCell>
                      <TableCell>{member.relationship}</TableCell>
                      <TableCell>
                        {member.owner_first_name} {member.owner_last_name}
                        <span className="text-muted-foreground text-sm block">
                          {member.owner_email}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(member.status)}</TableCell>
                      <TableCell>
                        {format(new Date(member.created_at), 'dd/MM/yyyy', { locale: he })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Requests Tab */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>בקשות הצטרפות פתוחות</CardTitle>
              <CardDescription>
                בקשות מבני משפחה שממתינות לאישור או דחייה
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>שם</TableHead>
                    <TableHead>אימייל</TableHead>
                    <TableHead>טלפון</TableHead>
                    <TableHead>קרבה</TableHead>
                    <TableHead>בעלים</TableHead>
                    <TableHead>תאריך בקשה</TableHead>
                    <TableHead>פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.full_name}</TableCell>
                      <TableCell>{request.email}</TableCell>
                      <TableCell>{request.phone}</TableCell>
                      <TableCell>{request.relationship}</TableCell>
                      <TableCell>
                        {request.owner_first_name} {request.owner_last_name}
                        <span className="text-muted-foreground text-sm block">
                          {request.owner_email}
                        </span>
                      </TableCell>
                      <TableCell>
                        {format(new Date(request.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleRequestAction(request.id, 'APPROVED')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 ml-1" />
                            אשר
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRequestAction(request.id, 'DECLINED')}
                          >
                            <XCircle className="h-4 w-4 ml-1" />
                            דחה
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {pendingRequests.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  אין בקשות הצטרפות פתוחות כרגע
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Management Tab */}
        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>ניהול הרשאות</CardTitle>
              <CardDescription>
                ניהול תפקידים והרשאות משתמשים במערכת
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RoleManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};