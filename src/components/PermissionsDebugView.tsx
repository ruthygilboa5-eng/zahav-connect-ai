import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { RefreshCw, Database } from 'lucide-react';

interface PermissionDebugData {
  permission_id: string;
  feature: string;
  status: string;
  permission_created_at: string;
  family_link_id: string;
  family_member_name: string;
  family_relationship: string;
  family_member_email: string;
  owner_user_id: string;
  member_user_id: string;
  owner_first_name: string;
  owner_last_name: string;
  owner_email: string;
  member_first_name: string;
  member_last_name: string;
  member_email: string;
}

const PermissionsDebugView = () => {
  const [debugData, setDebugData] = useState<PermissionDebugData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDebugData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First get all permissions with new main_user_id column
      const { data: permissionsData, error: permError } = await supabase
        .from('family_members_permissions')
        .select('*, main_user_id')
        .order('created_at', { ascending: false })
        .limit(20);

      if (permError) throw permError;

      if (!permissionsData || permissionsData.length === 0) {
        setDebugData([]);
        return;
      }

      // Get family links
      const familyLinkIds = permissionsData.map(p => p.family_member_id);
      const { data: familyLinksData, error: linksError } = await supabase
        .from('family_links')
        .select('*')
        .in('id', familyLinkIds);

      if (linksError) throw linksError;

      // Get user profiles for owners and members
      const allUserIds = [
        ...familyLinksData?.map(fl => fl.owner_user_id).filter(Boolean) || [],
        ...familyLinksData?.map(fl => fl.member_user_id).filter(Boolean) || [],
        ...permissionsData?.map(p => p.main_user_id).filter(Boolean) || []
      ];
      const uniqueUserIds = [...new Set(allUserIds)];

      const { data: userProfiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', uniqueUserIds);

      if (profilesError) throw profilesError;

      // Transform the data
      const transformedData: PermissionDebugData[] = permissionsData.map((perm) => {
        const familyLink = familyLinksData?.find(fl => fl.id === perm.family_member_id);
        const ownerProfile = userProfiles?.find(p => p.user_id === familyLink?.owner_user_id);
        const memberProfile = userProfiles?.find(p => p.user_id === familyLink?.member_user_id);

        return {
          permission_id: perm.id,
          feature: perm.feature,
          status: perm.status,
          permission_created_at: perm.created_at,
          family_link_id: familyLink?.id || '',
          family_member_name: familyLink?.full_name || '',
          family_relationship: familyLink?.relation || '',
          family_member_email: familyLink?.email || '',
          owner_user_id: familyLink?.owner_user_id || '',
          member_user_id: familyLink?.member_user_id || '',
          owner_first_name: ownerProfile?.first_name || '',
          owner_last_name: ownerProfile?.last_name || '',
          owner_email: ownerProfile?.email || '',
          member_first_name: memberProfile?.first_name || '',
          member_last_name: memberProfile?.last_name || '',
          member_email: memberProfile?.email || ''
        };
      });

      setDebugData(transformedData);
    } catch (err: any) {
      console.error('Error loading debug data:', err);
      setError(err.message || 'שגיאה בטעינת נתוני Debug');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDebugData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">ממתין לאישור</Badge>;
      case 'approved':
        return <Badge variant="default">אושר ✓</Badge>;
      case 'rejected':
        return <Badge variant="destructive">נדחה ✗</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getFullName = (firstName: string, lastName: string) => {
    return `${firstName} ${lastName}`.trim() || 'לא מוגדר';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            טוען נתוני Debug...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-destructive">
            שגיאה: {error}
          </div>
          <Button onClick={loadDebugData} className="mt-4">
            נסה שוב
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Database className="mr-2 h-5 w-5" />
            בדיקת קשרים בין טבלאות - הרשאות בני משפחה
          </CardTitle>
          <Button variant="outline" size="sm" onClick={loadDebugData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            רענן
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          תצוגת Debug לבדיקת קשרים בין family_members_permissions, family_links ו־user_profiles
        </p>
      </CardHeader>
      <CardContent>
        {debugData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">לא נמצאו בקשות הרשאות</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>פיצ׳ר</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>בן משפחה</TableHead>
                  <TableHead>קשר משפחתי</TableHead>
                  <TableHead>אימייל בן משפחה</TableHead>
                  <TableHead>משתמש ראשי</TableHead>
                  <TableHead>אימייל ראשי</TableHead>
                  <TableHead>תאריך יצירה</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {debugData.map((item) => (
                  <TableRow key={item.permission_id}>
                    <TableCell className="font-medium">{item.feature}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      {item.family_member_name || 
                       getFullName(item.member_first_name, item.member_last_name)}
                    </TableCell>
                    <TableCell>{item.family_relationship}</TableCell>
                    <TableCell>
                      {item.family_member_email || item.member_email || 'לא מוגדר'}
                    </TableCell>
                    <TableCell>
                      {getFullName(item.owner_first_name, item.owner_last_name)}
                    </TableCell>
                    <TableCell>
                      {item.owner_email || 'לא מוגדר'}
                    </TableCell>
                    <TableCell>
                      {new Date(item.permission_created_at).toLocaleDateString('he-IL')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">מידע על הקשרים:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• family_members_permissions.family_member_id → family_links.id</li>
            <li>• family_members_permissions.main_user_id → user_profiles.user_id (משתמש ראשי - מנורמל)</li>
            <li>• family_links.owner_user_id → user_profiles.user_id (משתמש ראשי)</li>
            <li>• family_links.member_user_id → user_profiles.user_id (בן משפחה)</li>
            <li>• סה״כ רשומות: {debugData.length}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default PermissionsDebugView;