import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Users, UserCheck, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import AppLayout from '@/components/AppLayout';

interface MainUser {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  created_at: string;
  family_members_count: number;
  pending_permissions_count: number;
}

interface FamilyMember {
  id: string;
  full_name: string;
  relationship_label: string;
  email: string;
  phone?: string;
  status: string;
  created_at: string;
  main_user_name: string;
}

interface SearchResult {
  id: string;
  name: string;
  email: string;
  type: 'main_user' | 'family_member';
  status?: string;
  main_user_name?: string;
  relationship?: string;
}

interface SystemStats {
  total_main_users: number;
  total_family_members: number;
  pending_requests: number;
  active_families: number;
}

const AdminSetupRealPage = () => {
  const [mainUsers, setMainUsers] = useState<MainUser[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'main_users' | 'family_members'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending' | 'rejected'>('all');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    total_main_users: 0,
    total_family_members: 0,
    pending_requests: 0,
    active_families: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, filterType, filterStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadMainUsers(),
        loadSystemStats()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'שגיאה בטעינת נתונים',
        description: 'אירעה שגיאה בטעינת נתוני המערכת',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMainUsers = async () => {
    const { data: usersData, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, user_id, first_name, last_name, email, created_at')
      .order('created_at', { ascending: false });

    if (usersError) throw usersError;

    const usersWithCounts = await Promise.all(
      (usersData || []).map(async (user) => {
        // Count family members
        const { count: familyCount } = await supabase
          .from('family_members')
          .select('id', { count: 'exact' })
          .eq('main_user_id', user.user_id);

        // Count pending permissions
        const { count: pendingCount } = await supabase
          .from('family_members_permissions')
          .select('id', { count: 'exact' })
          .eq('main_user_id', user.user_id)
          .eq('status', 'pending');

        return {
          ...user,
          family_members_count: familyCount || 0,
          pending_permissions_count: pendingCount || 0
        };
      })
    );

    setMainUsers(usersWithCounts);
  };

  const loadSystemStats = async () => {
    try {
      // Count main users
      const { count: mainUsersCount } = await supabase
        .from('user_profiles')
        .select('id', { count: 'exact' });

      // Count family members
      const { count: familyMembersCount } = await supabase
        .from('family_members')
        .select('id', { count: 'exact' });

      // Count pending permissions
      const { count: pendingCount } = await supabase
        .from('family_members_permissions')
        .select('id', { count: 'exact' })
        .eq('status', 'pending');

      // Count active families (main users with at least one family member)
      const { data: activeFamiliesData } = await supabase
        .from('family_members')
        .select('main_user_id')
        .not('main_user_id', 'is', null);

      const uniqueMainUsers = new Set(activeFamiliesData?.map(f => f.main_user_id) || []);

      setSystemStats({
        total_main_users: mainUsersCount || 0,
        total_family_members: familyMembersCount || 0,
        pending_requests: pendingCount || 0,
        active_families: uniqueMainUsers.size
      });
    } catch (error) {
      console.error('Error loading system stats:', error);
    }
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const results: SearchResult[] = [];

      // Search main users
      if (filterType === 'all' || filterType === 'main_users') {
        const { data: mainUsersData } = await supabase
          .from('user_profiles')
          .select('id, user_id, first_name, last_name, email')
          .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);

        (mainUsersData || []).forEach(user => {
          results.push({
            id: user.user_id,
            name: `${user.first_name} ${user.last_name}`.trim(),
            email: user.email || '',
            type: 'main_user',
            status: 'active'
          });
        });
      }

      // Search family members
      if (filterType === 'all' || filterType === 'family_members') {
        const { data: familyMembersData } = await supabase
          .from('family_members')
          .select(`
            id, full_name, email, status, relationship_label,
            user_profiles!family_members_main_user_id_fkey (first_name, last_name)
          `)
          .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);

        (familyMembersData || []).forEach(member => {
          const mainUserProfile = member.user_profiles as any;
          if (filterStatus === 'all' || member.status.toLowerCase() === filterStatus) {
            results.push({
              id: member.id,
              name: member.full_name,
              email: member.email,
              type: 'family_member',
              status: member.status,
              main_user_name: mainUserProfile ? 
                `${mainUserProfile.first_name} ${mainUserProfile.last_name}`.trim() : 
                'לא ידוע',
              relationship: member.relationship_label
            });
          }
        });
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Error performing search:', error);
    }
  };

  const loadFamilyMembers = async (mainUserId: string): Promise<FamilyMember[]> => {
    const { data, error } = await supabase
      .from('family_members')
      .select(`
        id, full_name, relationship_label, email, phone, status, created_at,
        user_profiles!family_members_main_user_id_fkey (first_name, last_name)
      `)
      .eq('main_user_id', mainUserId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(member => {
      const mainUserProfile = member.user_profiles as any;
      return {
        ...member,
        main_user_name: mainUserProfile ? 
          `${mainUserProfile.first_name} ${mainUserProfile.last_name}`.trim() : 
          'לא ידוע'
      };
    });
  };

  const toggleUserExpansion = async (userId: string) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
    } else {
      setExpandedUser(userId);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">פעיל</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">ממתין</Badge>;
      case 'rejected':
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

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-pulse">טוען נתוני המערכת...</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6" dir="rtl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">ניהול אפליקציה</h1>
          <p className="text-muted-foreground">
            צפה וניהל את כל המשתמשים ובני המשפחה במערכת
          </p>
        </div>

        {/* System Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{systemStats.total_main_users}</div>
                <p className="text-sm font-medium">משתמשים ראשיים</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{systemStats.total_family_members}</div>
                <p className="text-sm font-medium">בני משפחה רשומים</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{systemStats.pending_requests}</div>
                <p className="text-sm font-medium">בקשות הרשאה פתוחות</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{systemStats.active_families}</div>
                <p className="text-sm font-medium">משפחות פעילות</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>חיפוש וסינון</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="חפש לפי שם או אימייל..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="סוג משתמש" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל המשתמשים</SelectItem>
                  <SelectItem value="main_users">משתמשים ראשיים</SelectItem>
                  <SelectItem value="family_members">בני משפחה</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הסטטוסים</SelectItem>
                  <SelectItem value="active">פעיל</SelectItem>
                  <SelectItem value="pending">ממתין</SelectItem>
                  <SelectItem value="rejected">נדחה</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {searchQuery && (
          <Card>
            <CardHeader>
              <CardTitle>תוצאות חיפוש</CardTitle>
              <CardDescription>
                נמצאו {searchResults.length} תוצאות עבור "{searchQuery}"
              </CardDescription>
            </CardHeader>
            <CardContent>
              {searchResults.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">לא נמצאו תוצאות</p>
              ) : (
                <div className="space-y-3">
                  {searchResults.map((result) => (
                    <div key={`${result.type}-${result.id}`} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{result.name}</span>
                            <Badge variant="outline">
                              {result.type === 'main_user' ? 'משתמש ראשי' : 'בן משפחה'}
                            </Badge>
                            {result.status && getStatusBadge(result.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">{result.email}</p>
                          {result.main_user_name && (
                            <p className="text-sm text-muted-foreground">
                              משויך ל: {result.main_user_name} ({result.relationship})
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Main Users List */}
        {!searchQuery && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                משתמשים ראשיים
              </CardTitle>
              <CardDescription>
                רשימת כל המשתמשים הראשיים במערכת
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mainUsers.map((user) => (
                  <div key={user.user_id} className="border rounded-lg">
                    <div 
                      className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleUserExpansion(user.user_id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-lg">
                              {`${user.first_name} ${user.last_name}`.trim()}
                            </h3>
                            <Badge className="bg-blue-100 text-blue-800">משתמש ראשי</Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <p><strong>אימייל:</strong> {user.email || 'לא הוגדר'}</p>
                            <p><strong>תאריך הרשמה:</strong> {formatDate(user.created_at)}</p>
                            <p><strong>בני משפחה:</strong> {user.family_members_count}</p>
                            <p><strong>בקשות הרשאה פתוחות:</strong> {user.pending_permissions_count}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {user.pending_permissions_count > 0 && (
                            <AlertCircle className="h-5 w-5 text-orange-500" />
                          )}
                          {expandedUser === user.user_id ? 
                            <ChevronUp className="h-5 w-5" /> : 
                            <ChevronDown className="h-5 w-5" />
                          }
                        </div>
                      </div>
                    </div>
                    
                    {/* Expanded Family Members */}
                    {expandedUser === user.user_id && (
                      <div className="border-t bg-muted/20 p-4">
                        <FamilyMembersSection mainUserId={user.user_id} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

// Separate component for family members to avoid prop drilling
const FamilyMembersSection = ({ mainUserId }: { mainUserId: string }) => {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFamilyMembers();
  }, [mainUserId]);

  const loadFamilyMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('family_members')
        .select('id, full_name, relationship_label, email, phone, status, created_at')
        .eq('main_user_id', mainUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFamilyMembers((data || []).map(member => ({
        ...member,
        main_user_name: '' // Add this required property
      })));
    } catch (error) {
      console.error('Error loading family members:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">פעיל</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">ממתין</Badge>;
      case 'rejected':
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

  if (loading) {
    return <div className="text-center py-4">טוען בני משפחה...</div>;
  }

  if (familyMembers.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        אין בני משפחה משויכים למשתמש זה
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm text-muted-foreground">בני משפחה משויכים:</h4>
      {familyMembers.map((member) => (
        <div key={member.id} className="bg-background border rounded-lg p-3">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{member.full_name}</span>
                {getStatusBadge(member.status)}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-xs text-muted-foreground">
                <p><strong>קשר משפחתי:</strong> {member.relationship_label}</p>
                <p><strong>אימייל:</strong> {member.email}</p>
                {member.phone && (
                  <p><strong>טלפון:</strong> {member.phone}</p>
                )}
                <p><strong>תאריך רישום:</strong> {formatDate(member.created_at)}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminSetupRealPage;