import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Shield, User, Users } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'primary_user' | 'family_member';
  email: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
}

export const RoleManagement = () => {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'primary_user' | 'family_member'>('primary_user');
  const { toast } = useToast();

  useEffect(() => {
    loadUserRoles();
  }, []);

  const loadUserRoles = async () => {
    try {
      setIsLoading(true);
      
      // Get all user roles with user profiles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role,
          created_at
        `);

      if (rolesError) throw rolesError;

      // Get user profiles for each role
      const userRolesWithProfiles = await Promise.all(
        (rolesData || []).map(async (roleEntry) => {
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('first_name, last_name, email')
            .eq('user_id', roleEntry.user_id)
            .single();

          return {
            ...roleEntry,
            email: userProfile?.email || '',
            first_name: userProfile?.first_name || '',
            last_name: userProfile?.last_name || '',
          };
        })
      );

      setUserRoles(userRolesWithProfiles);
    } catch (error) {
      console.error('Error loading user roles:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בטעינת הרשאות המשתמשים',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRole = async () => {
    if (!newUserEmail.trim()) {
      toast({
        title: 'שגיאה',
        description: 'נא למלא כתובת אימייל',
        variant: 'destructive',
      });
      return;
    }

    setIsAdding(true);

    try {
      // First, check if user exists by getting auth user data through profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, email, first_name, last_name')
        .eq('email', newUserEmail)
        .single();

      if (profilesError || !profiles) {
        toast({
          title: 'משתמש לא נמצא',
          description: 'המשתמש עם האימייל הזה לא רשום במערכת. המשתמש צריך להירשם תחילה.',
          variant: 'destructive',
        });
        return;
      }

      // Check if user already has a role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', profiles.user_id)
        .single();

      if (existingRole) {
        toast({
          title: 'משתמש כבר קיים',
          description: 'למשתמש הזה כבר יש תפקיד במערכת',
          variant: 'destructive',
        });
        return;
      }

      // Add the role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: profiles.user_id,
          role: newUserRole
        });

      if (roleError) throw roleError;

      toast({
        title: 'הרשאה נוספה',
        description: `תפקיד ${getRoleDisplayName(newUserRole)} נוסף בהצלחה למשתמש`,
      });

      setNewUserEmail('');
      setNewUserRole('primary_user');
      loadUserRoles();
    } catch (error) {
      console.error('Error adding role:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בהוספת הרשאה',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveRole = async (roleId: string, userEmail: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      toast({
        title: 'הרשאה הוסרה',
        description: `הרשאה הוסרה בהצלחה מהמשתמש ${userEmail}`,
      });

      loadUserRoles();
    } catch (error) {
      console.error('Error removing role:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בהסרת הרשאה',
        variant: 'destructive',
      });
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'מנהל מערכת';
      case 'primary_user':
        return 'משתמש ראשי';
      case 'family_member':
        return 'בן משפחה';
      default:
        return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'primary_user':
        return <User className="h-4 w-4" />;
      case 'family_member':
        return <Users className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'primary_user':
        return 'default';
      case 'family_member':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-pulse">טוען נתוני הרשאות...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add New Role Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            הוספת הרשאה חדשה
          </CardTitle>
          <CardDescription>
            הוסף תפקיד למשתמש קיים במערכת
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">אימייל המשתמש</Label>
              <Input
                id="email"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="הכנס כתובת אימייל"
                dir="ltr"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">תפקיד</Label>
              <Select value={newUserRole} onValueChange={(value: any) => setNewUserRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">מנהל מערכת</SelectItem>
                  <SelectItem value="primary_user">משתמש ראשי</SelectItem>
                  <SelectItem value="family_member">בן משפחה</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={handleAddRole} 
                disabled={isAdding}
                className="w-full"
              >
                {isAdding ? 'מוסיף...' : 'הוסף הרשאה'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle>הרשאות קיימות</CardTitle>
          <CardDescription>
            רשימת כל המשתמשים והתפקידים שלהם במערכת
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userRoles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              לא נמצאו הרשאות במערכת
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>שם</TableHead>
                  <TableHead>אימייל</TableHead>
                  <TableHead>תפקיד</TableHead>
                  <TableHead>תאריך הוספה</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userRoles.map((userRole) => (
                  <TableRow key={userRole.id}>
                    <TableCell className="font-medium">
                      {userRole.first_name} {userRole.last_name}
                    </TableCell>
                    <TableCell dir="ltr">{userRole.email}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={getRoleBadgeVariant(userRole.role)}
                        className="flex items-center gap-1 w-fit"
                      >
                        {getRoleIcon(userRole.role)}
                        {getRoleDisplayName(userRole.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(userRole.created_at).toLocaleDateString('he-IL')}
                    </TableCell>
                    <TableCell>
                      {userRole.role !== 'admin' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>הסרת הרשאה</AlertDialogTitle>
                              <AlertDialogDescription>
                                האם אתה בטוח שברצונך להסיר את התפקיד של המשתמש {userRole.email}?
                                פעולה זו אינה ניתנת לביטול.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>ביטול</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemoveRole(userRole.id, userRole.email)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                הסר הרשאה
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      {userRole.role === 'admin' && (
                        <Badge variant="outline" className="text-xs">
                          מוגן
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
