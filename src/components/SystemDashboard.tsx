import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Search, 
  Filter, 
  Users, 
  UserPlus, 
  AlertCircle, 
  ChevronDown, 
  ChevronRight,
  Database,
  Activity,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface SystemStats {
  totalMainUsers: number;
  totalFamilyMembers: number;
  pendingRequests: number;
  activeFamilies: number;
}

interface MainUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  family_members_count: number;
  pending_requests_count: number;
  family_members?: FamilyMemberDetails[];
}

interface FamilyMemberDetails {
  id: string;
  full_name: string;
  relationship_label: string;
  email: string;
  status: string;
  created_at: string;
  last_request_date?: string;
}

interface SearchResult {
  id: string;
  name: string;
  email: string;
  type: 'main_user' | 'family_member';
  status: string;
  main_user_name?: string;
  created_at: string;
}

export default function SystemDashboard() {
  const { authState } = useAuth();
  const { toast } = useToast();
  
  const [stats, setStats] = useState<SystemStats>({
    totalMainUsers: 0,
    totalFamilyMembers: 0,
    pendingRequests: 0,
    activeFamilies: 0
  });
  const [mainUsers, setMainUsers] = useState<MainUser[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'main_users' | 'family_members'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [isSearchMode, setIsSearchMode] = useState(false);

  // Load system statistics
  const loadSystemStats = async () => {
    try {
      // Count main users
      const { count: mainUsersCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      // Count family members
      const { count: familyMembersCount } = await supabase
        .from('family_members')
        .select('*', { count: 'exact', head: true });

      // Count pending permission requests
      const { count: pendingCount } = await supabase
        .from('family_members_permissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Count active families (users with at least one family member)
      const { data: activeFamiliesData } = await supabase
        .from('family_members')
        .select('main_user_id')
        .not('main_user_id', 'is', null);

      const uniqueFamilies = new Set(activeFamiliesData?.map(f => f.main_user_id) || []).size;

      setStats({
        totalMainUsers: mainUsersCount || 0,
        totalFamilyMembers: familyMembersCount || 0,
        pendingRequests: pendingCount || 0,
        activeFamilies: uniqueFamilies
      });
    } catch (error) {
      console.error('Error loading system stats:', error);
    }
  };

  // Load main users with their family members count
  const loadMainUsers = async () => {
    try {
      setLoading(true);

      // Get all main users
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      if (!users || users.length === 0) {
        setMainUsers([]);
        return;
      }

      // Get family members counts and pending requests counts for each user
      const userIds = users.map(u => u.user_id);

      // Count family members per user
      const { data: familyCounts } = await supabase
        .from('family_members')
        .select('main_user_id')
        .in('main_user_id', userIds);

      // Count pending requests per user  
      const { data: requestCounts } = await supabase
        .from('family_members_permissions')
        .select('main_user_id')
        .eq('status', 'pending')
        .in('main_user_id', userIds);

      // Create counts maps
      const familyCountMap = new Map<string, number>();
      const requestCountMap = new Map<string, number>();

      familyCounts?.forEach(fc => {
        if (fc.main_user_id) {
          familyCountMap.set(fc.main_user_id, (familyCountMap.get(fc.main_user_id) || 0) + 1);
        }
      });

      requestCounts?.forEach(rc => {
        if (rc.main_user_id) {
          requestCountMap.set(rc.main_user_id, (requestCountMap.get(rc.main_user_id) || 0) + 1);
        }
      });

      // Format users data
      const formattedUsers: MainUser[] = users.map(user => ({
        id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email || '',
        created_at: user.created_at,
        family_members_count: familyCountMap.get(user.user_id) || 0,
        pending_requests_count: requestCountMap.get(user.user_id) || 0
      }));

      setMainUsers(formattedUsers);
    } catch (error: any) {
      console.error('Error loading main users:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בטעינת נתוני המשתמשים',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Load family members for a specific main user
  const loadFamilyMembers = async (mainUserId: string): Promise<FamilyMemberDetails[]> => {
    try {
      const { data: familyMembers, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('main_user_id', mainUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get last request dates
      const memberIds = familyMembers?.map(fm => fm.id) || [];
      
      if (memberIds.length === 0) return [];

      const { data: lastRequests } = await supabase
        .from('family_members_permissions')
        .select('family_member_id, created_at')
        .in('family_member_id', memberIds)
        .order('created_at', { ascending: false });

      // Create map of last request dates
      const lastRequestMap = new Map<string, string>();
      lastRequests?.forEach(lr => {
        if (!lastRequestMap.has(lr.family_member_id)) {
          lastRequestMap.set(lr.family_member_id, lr.created_at);
        }
      });

      return familyMembers?.map(fm => ({
        id: fm.id,
        full_name: fm.full_name,
        relationship_label: fm.relationship_label,
        email: fm.email,
        status: fm.status,
        created_at: fm.created_at,
        last_request_date: lastRequestMap.get(fm.id)
      })) || [];
    } catch (error) {
      console.error('Error loading family members:', error);
      return [];
    }
  };

  // Handle row expansion
  const toggleRowExpansion = async (userId: string) => {
    const newExpanded = new Set(expandedRows);
    
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
      
      // Load family members if not already loaded
      const user = mainUsers.find(u => u.id === userId);
      if (user && !user.family_members) {
        const familyMembers = await loadFamilyMembers(userId);
        setMainUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, family_members: familyMembers } : u
        ));
      }
    }
    
    setExpandedRows(newExpanded);
  };

  // Search functionality
  const performSearch = async () => {
    if (!searchQuery.trim()) {
      setIsSearchMode(false);
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      setIsSearchMode(true);

      let results: SearchResult[] = [];

      // Search main users if not filtering for family members only
      if (filterType !== 'family_members') {
        const { data: mainUsersResults, error: mainUsersError } = await supabase
          .from('user_profiles')
          .select('user_id, first_name, last_name, email, created_at')
          .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);

        if (mainUsersError) throw mainUsersError;

        const mainUserResults: SearchResult[] = mainUsersResults?.map(user => ({
          id: user.user_id,
          name: `${user.first_name} ${user.last_name}`.trim(),
          email: user.email || '',
          type: 'main_user' as const,
          status: 'active',
          created_at: user.created_at
        })) || [];

        results = [...results, ...mainUserResults];
      }

      // Search family members if not filtering for main users only
      if (filterType !== 'main_users') {
        // First get family members with main_user_id
        const { data: familyMembersData, error: familyMembersError } = await supabase
          .from('family_members')
          .select('id, full_name, email, status, created_at, main_user_id')
          .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);

        if (familyMembersError) throw familyMembersError;

        if (familyMembersData && familyMembersData.length > 0) {
          // Get main user profiles for the family members
          const mainUserIds = [...new Set(familyMembersData.map(fm => fm.main_user_id).filter(Boolean))];
          
          const { data: mainUsersData } = await supabase
            .from('user_profiles')
            .select('user_id, first_name, last_name')
            .in('user_id', mainUserIds);

          // Create a map for quick lookup
          const mainUsersMap = new Map();
          mainUsersData?.forEach(user => {
            mainUsersMap.set(user.user_id, `${user.first_name} ${user.last_name}`.trim());
          });

          const familyMemberResults: SearchResult[] = familyMembersData.map(fm => ({
            id: fm.id,
            name: fm.full_name,
            email: fm.email,
            type: 'family_member' as const,
            status: fm.status,
            main_user_name: mainUsersMap.get(fm.main_user_id) || 'לא ידוע',
            created_at: fm.created_at
          }));

          results = [...results, ...familyMemberResults];
        }
      }

      // Apply status filter
      if (filterStatus !== 'all') {
        results = results.filter(result => {
          if (filterStatus === 'pending') return result.status === 'pending' || result.status === 'PENDING';
          if (filterStatus === 'approved') return result.status === 'active' || result.status === 'ACTIVE';
          if (filterStatus === 'rejected') return result.status === 'rejected' || result.status === 'REJECTED';
          return true;
        });
      }

      setSearchResults(results);
    } catch (error: any) {
      console.error('Error performing search:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בביצוע החיפוש',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setIsSearchMode(false);
    setSearchResults([]);
    setFilterType('all');
    setFilterStatus('all');
  };

  const getStatusBadge = (status: string, type: 'main_user' | 'family_member') => {
    if (type === 'main_user') {
      return <Badge variant="default" className="bg-blue-100 text-blue-800">משתמש ראשי</Badge>;
    }

    switch (status.toLowerCase()) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">פעיל</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">ממתין</Badge>;
      case 'rejected':
        return <Badge variant="destructive">נדחה</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  useEffect(() => {
    loadSystemStats();
    loadMainUsers();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch();
      } else {
        setIsSearchMode(false);
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, filterType, filterStatus]);

  return (
    <div className="container mx-auto py-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="h-8 w-8" />
            ניהול מערכת
          </h1>
          <p className="text-muted-foreground">
            ניהול משתמשים, בני משפחה ובקשות הרשאות
          </p>
        </div>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">משתמשים ראשיים</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMainUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">בני משפחה</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFamilyMembers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">בקשות ממתינות</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingRequests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">משפחות פעילות</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeFamilies}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            חיפוש וסינון
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="חפש לפי שם או אימייל..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="סוג משתמש" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל המשתמשים</SelectItem>
                <SelectItem value="main_users">משתמשים ראשיים</SelectItem>
                <SelectItem value="family_members">בני משפחה</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                <SelectItem value="approved">פעיל/מאושר</SelectItem>
                <SelectItem value="pending">ממתין</SelectItem>
                <SelectItem value="rejected">נדחה</SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery || filterType !== 'all' || filterStatus !== 'all') && (
              <Button variant="outline" onClick={clearSearch}>
                נקה
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isSearchMode ? `תוצאות חיפוש (${searchResults.length})` : `כל המשתמשים (${mainUsers.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-pulse">טוען נתונים...</div>
              </div>
            </div>
          ) : isSearchMode ? (
            // Search Results View
            searchResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                לא נמצאו תוצאות עבור החיפוש "{searchQuery}"
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>שם מלא</TableHead>
                    <TableHead>אימייל</TableHead>
                    <TableHead>סוג</TableHead>
                    <TableHead>סטטוס</TableHead>
                    <TableHead>משויך למשתמש ראשי</TableHead>
                    <TableHead>תאריך הרשמה</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.map((result) => (
                    <TableRow key={`${result.type}-${result.id}`}>
                      <TableCell className="font-medium">{result.name}</TableCell>
                      <TableCell>{result.email}</TableCell>
                      <TableCell>
                        <Badge variant={result.type === 'main_user' ? 'default' : 'secondary'}>
                          {result.type === 'main_user' ? 'משתמש ראשי' : 'בן משפחה'}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(result.status, result.type)}</TableCell>
                      <TableCell>
                        {result.type === 'family_member' ? result.main_user_name : '-'}
                      </TableCell>
                      <TableCell>
                        {format(new Date(result.created_at), 'dd/MM/yyyy', { locale: he })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          ) : (
            // Main Users View with Expandable Rows
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>שם מלא</TableHead>
                  <TableHead>אימייל</TableHead>
                  <TableHead>תאריך הרשמה</TableHead>
                  <TableHead>בני משפחה</TableHead>
                  <TableHead>בקשות ממתינות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mainUsers.map((user) => (
                  <React.Fragment key={user.id}>
                    <TableRow>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRowExpansion(user.id)}
                          disabled={user.family_members_count === 0}
                        >
                          {user.family_members_count > 0 ? (
                            expandedRows.has(user.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )
                          ) : null}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">
                        {`${user.first_name} ${user.last_name}`.trim()}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: he })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {user.family_members_count}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.pending_requests_count > 0 ? (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            {user.pending_requests_count}
                          </Badge>
                        ) : (
                          <Badge variant="outline">0</Badge>
                        )}
                      </TableCell>
                    </TableRow>

                    {/* Expanded Family Members */}
                    {expandedRows.has(user.id) && user.family_members && (
                      <TableRow>
                        <TableCell colSpan={6} className="p-0">
                          <div className="bg-muted/50 p-4">
                            <h4 className="font-semibold mb-3">בני משפחה של {user.first_name} {user.last_name}</h4>
                            {user.family_members.length === 0 ? (
                              <p className="text-muted-foreground">אין בני משפחה משויכים</p>
                            ) : (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>שם מלא</TableHead>
                                    <TableHead>קשר משפחתי</TableHead>
                                    <TableHead>אימייל</TableHead>
                                    <TableHead>סטטוס</TableHead>
                                    <TableHead>תאריך הרשמה</TableHead>
                                    <TableHead>בקשה אחרונה</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {user.family_members.map((member) => (
                                    <TableRow key={member.id}>
                                      <TableCell className="font-medium">{member.full_name}</TableCell>
                                      <TableCell>{member.relationship_label}</TableCell>
                                      <TableCell>{member.email}</TableCell>
                                      <TableCell>{getStatusBadge(member.status, 'family_member')}</TableCell>
                                      <TableCell>
                                        {format(new Date(member.created_at), 'dd/MM/yyyy', { locale: he })}
                                      </TableCell>
                                      <TableCell>
                                        {member.last_request_date ? 
                                          format(new Date(member.last_request_date), 'dd/MM/yyyy', { locale: he }) :
                                          'אין בקשות'
                                        }
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}