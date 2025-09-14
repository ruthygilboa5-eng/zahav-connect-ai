import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Users, UserPlus, AlertCircle, LogOut, Clock, Filter, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import PermissionsDebugView from '@/components/PermissionsDebugView';
import SystemDashboard from '@/components/SystemDashboard';

interface PermissionRequest {
  id: string;
  family_link_id: string;
  scope: string;
  status: string;
  created_at: string;
  family_member_name: string;
  family_member_email: string;
  owner_user_id: string;
}

interface FamilyMember {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  relationship_to_primary_user: string;
  status: string;
  created_at: string;
  owner_user_id: string;
}

interface DashboardStats {
  activeUsers: number;
  totalFamilies: number;
  pendingApprovals: number;
  pendingPermissions: number;
}

export default function AdminRealDashboard() {
  const { authState } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { 
    permissionRequests, 
    loading: permissionsLoading, 
    updatePermissionStatus, 
    getPendingCount,
    getRequestsByStatus 
  } = useAdminPermissions();
  
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ 
    activeUsers: 0, 
    totalFamilies: 0, 
    pendingApprovals: 0,
    pendingPermissions: 0 
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const isAdmin = authState.role === 'ADMIN';

  useEffect(() => {
    if (isAdmin) {
      loadDashboardData();
      
      // Set up real-time subscription for permission requests
      const permissionsChannel = supabase
        .channel('admin-permission-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'family_members_permissions'
          },
          (payload) => {
            console.log('Permission change received:', payload);
            loadDashboardData(); // Reload data when permissions change
          }
        )
        .subscribe();

      // Set up real-time subscription for family links
      const familyChannel = supabase
        .channel('admin-family-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'family_links'
          },
          (payload) => {
            console.log('Family link change received:', payload);
            loadDashboardData(); // Reload data when family links change
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(permissionsChannel);
        supabase.removeChannel(familyChannel);
      };
    }
  }, [isAdmin, getPendingCount]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load family members
      const { data: familyData, error: familyError } = await supabase
        .from('family_links')
        .select('*');

      if (familyError) throw familyError;
      setFamilyMembers(familyData || []);

      // Load users count
      const { count: usersCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      // Load pending family links
      const { count: pendingCount } = await supabase
        .from('family_links')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING');

      // Calculate stats (permission requests count will come from the hook)
      setStats({
        activeUsers: usersCount || 0,
        totalFamilies: familyData?.length || 0,
        pendingApprovals: pendingCount || 0,
        pendingPermissions: getPendingCount()
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

  const handlePermissionAction = async (requestId: string, action: 'approved' | 'rejected') => {
    const request = permissionRequests.find(r => r.id === requestId);
    if (!request) return;

    await updatePermissionStatus(
      requestId, 
      action, 
      request.family_member_name, 
      request.family_member_email, 
      request.feature
    );
    
    // Update stats after action
    setStats(prev => ({
      ...prev,
      pendingPermissions: getPendingCount()
    }));
  };

  const handleFamilyMemberAction = async (memberId: string, action: 'APPROVED' | 'DECLINED') => {
    try {
      const { error } = await supabase
        .from('family_links')
        .update({ status: action })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: 'הפעולה בוצעה בהצלחה',
        description: action === 'APPROVED' ? 'בן המשפחה אושר' : 'בן המשפחה נדחה'
      });

      // Reload data
      loadDashboardData();
    } catch (error) {
      console.error('Error updating family member:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בעדכון בן המשפחה',
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

  const getScopeLabel = (feature: string) => {
    const featureLabels: Record<string, string> = {
      'wakeup': 'שירות השכמה',
      'memories': 'זיכרונות ותמונות',
      'games': 'משחקים',
      'reminders': 'תזכורות',
      'emergency': 'שירותי חירום',
      'contacts': 'אנשי קשר',
      'family_board': 'לוח המשפחה'
    };
    return featureLabels[feature] || feature;
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
    <>
      {/* Real Mode Banner */}
      <div className="w-full bg-green-50 border-b border-green-200 py-2">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-green-800 font-medium">
            🟢 מצב אמיתי – נתונים מחוברים לחשבון שלך
          </p>
        </div>
      </div>
      
      <div className="container mx-auto py-6 space-y-6" dir="rtl">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">מסך ניהול מערכת</h1>
            <p className="text-muted-foreground">ניהול משתמשים ובקשות הרשאות</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              onClick={() => navigate('/system-dashboard')}
              className="flex items-center gap-2"
            >
              <Database className="h-4 w-4" />
              ניהול מערכת מתקדם
            </Button>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              התנתק
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
              <CardTitle className="text-sm font-medium">בני משפחה</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFamilies}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">בקשות הצטרפות</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">בקשות הרשאות</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingPermissions}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="permissions" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="permissions">בקשות הרשאות</TabsTrigger>
            <TabsTrigger value="family">בני משפחה</TabsTrigger>
            <TabsTrigger value="system">ניהול מערכת</TabsTrigger>
            <TabsTrigger value="debug">בדיקת קשרים</TabsTrigger>
          </TabsList>

          {/* Permission Requests Tab */}
          <TabsContent value="permissions">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>ניהול בקשות הרשאות</CardTitle>
                    <CardDescription>
                      בקשות הרשאות מבני משפחה לגישה לפיצ'רים שונים
                    </CardDescription>
                  </div>
                  <Select
                    value={statusFilter}
                    onValueChange={(value: any) => setStatusFilter(value)}
                  >
                    <SelectTrigger className="w-40">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כל הבקשות</SelectItem>
                      <SelectItem value="pending">ממתינות</SelectItem>
                      <SelectItem value="approved">מאושרות</SelectItem>
                      <SelectItem value="rejected">נדחות</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {permissionsLoading ? (
                  <div className="text-center py-8">
                    <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>טוען בקשות הרשאות...</p>
                  </div>
                ) : (
                  <>
                    {(() => {
                      const filteredRequests = statusFilter === 'all' 
                        ? permissionRequests 
                        : getRequestsByStatus(statusFilter as any);
                      
                      return filteredRequests.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>בן משפחה</TableHead>
                              <TableHead>קרבה</TableHead>
                              <TableHead>פיצ'ר מבוקש</TableHead>
                              <TableHead>תאריך בקשה</TableHead>
                              <TableHead>סטטוס</TableHead>
                              <TableHead>פעולות</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredRequests.map((request) => (
                              <TableRow key={request.id}>
                                <TableCell className="font-medium">
                                  {request.family_member_name}
                                  <span className="text-muted-foreground text-sm block">
                                    {request.family_member_email}
                                  </span>
                                </TableCell>
                                <TableCell>{request.relationship_to_primary_user || 'לא צוין'}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {getScopeLabel(request.feature)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {format(new Date(request.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                                </TableCell>
                                <TableCell>{getStatusBadge(request.status)}</TableCell>
                                <TableCell>
                                  {request.status === 'pending' ? (
                                    <div className="flex space-x-2 space-x-reverse">
                                      <Button
                                        size="sm"
                                        onClick={() => handlePermissionAction(request.id, 'approved')}
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        <CheckCircle className="h-4 w-4 ml-1" />
                                        אשר
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handlePermissionAction(request.id, 'rejected')}
                                      >
                                        <XCircle className="h-4 w-4 ml-1" />
                                        דחה
                                      </Button>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">
                                      {request.status === 'approved' ? 'טופל - אושר' : 'טופל - נדחה'}
                                    </span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          {statusFilter === 'all' 
                            ? 'אין בקשות הרשאות כרגע'
                            : `אין בקשות ${statusFilter === 'pending' ? 'ממתינות' : statusFilter === 'approved' ? 'מאושרות' : 'נדחות'}`
                          }
                        </div>
                      );
                    })()}
                  </>
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
                      <TableHead>סטטוס</TableHead>
                      <TableHead>תאריך יצירה</TableHead>
                      <TableHead>פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {familyMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.full_name}</TableCell>
                        <TableCell>{member.email || 'לא צוין'}</TableCell>
                        <TableCell>{member.phone || 'לא צוין'}</TableCell>
                        <TableCell>{member.relationship_to_primary_user || 'לא צוין'}</TableCell>
                        <TableCell>{getStatusBadge(member.status)}</TableCell>
                        <TableCell>
                          {format(new Date(member.created_at), 'dd/MM/yyyy', { locale: he })}
                        </TableCell>
                        <TableCell>
                          {member.status === 'PENDING' && (
                            <div className="flex space-x-2 space-x-reverse">
                              <Button
                                size="sm"
                                onClick={() => handleFamilyMemberAction(member.id, 'APPROVED')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 ml-1" />
                                אשר
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleFamilyMemberAction(member.id, 'DECLINED')}
                              >
                                <XCircle className="h-4 w-4 ml-1" />
                                דחה
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Management Tab */}
          <TabsContent value="system">
            <SystemDashboard />
          </TabsContent>

          {/* Debug Tab */}
          <TabsContent value="debug">
            <PermissionsDebugView />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}