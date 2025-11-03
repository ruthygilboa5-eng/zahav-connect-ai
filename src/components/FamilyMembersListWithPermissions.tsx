import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User, Shield, Check, X, Clock } from 'lucide-react';
import { FamilyScope, scopeLabels } from '@/types/family';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface FamilyLinkWithPermissions {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  relation: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'CANCELLED';
  scopes: FamilyScope[];
  created_at: string;
  permissions_requests: Array<{
    id: string;
    permission_type: FamilyScope;
    status: 'PENDING' | 'APPROVED' | 'DECLINED';
  }>;
}

const FamilyMembersListWithPermissions = () => {
  const [familyMembers, setFamilyMembers] = useState<FamilyLinkWithPermissions[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<FamilyLinkWithPermissions | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const allScopes: FamilyScope[] = [
    'POST_MEDIA',
    'SUGGEST_REMINDER',
    'INVITE_GAME',
    'CHAT',
    'EMERGENCY_ONLY',
    'WAKE_UP_NOTIFICATION'
  ];

  useEffect(() => {
    loadFamilyMembers();
  }, []);

  const loadFamilyMembers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch family links with their permission requests
      const { data: links, error: linksError } = await supabase
        .from('family_links')
        .select(`
          *,
          permissions_requests (
            id,
            permission_type,
            status
          )
        `)
        .eq('owner_user_id', user.id)
        .order('created_at', { ascending: false });

      if (linksError) throw linksError;

      setFamilyMembers(links as FamilyLinkWithPermissions[]);
    } catch (error: any) {
      console.error('Error loading family members:', error);
      toast.error('שגיאה בטעינת רשימת בני המשפחה');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenPermissions = (member: FamilyLinkWithPermissions) => {
    setSelectedMember(member);
    setIsDialogOpen(true);
  };

  const handleUpdatePermission = async (permissionRequestId: string, newStatus: 'APPROVED' | 'DECLINED') => {
    if (!selectedMember) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('permissions_requests')
        .update({ status: newStatus })
        .eq('id', permissionRequestId);

      if (error) throw error;

      toast.success(newStatus === 'APPROVED' ? 'ההרשאה אושרה' : 'ההרשאה נדחתה');
      await loadFamilyMembers();
      
      // Update selected member
      const updatedMember = familyMembers.find(m => m.id === selectedMember.id);
      if (updatedMember) {
        setSelectedMember(updatedMember);
      }
    } catch (error: any) {
      console.error('Error updating permission:', error);
      toast.error('שגיאה בעדכון ההרשאה');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateFamilyLink = async (linkId: string, newStatus: 'APPROVED' | 'DECLINED') => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('family_links')
        .update({ status: newStatus })
        .eq('id', linkId);

      if (error) throw error;

      toast.success(newStatus === 'APPROVED' ? 'בן המשפחה אושר' : 'בן המשפחה נדחה');
      await loadFamilyMembers();
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error updating family link:', error);
      toast.error('שגיאה בעדכון סטטוס בן המשפחה');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          ממתין
        </Badge>;
      case 'APPROVED':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 flex items-center gap-1">
          <Check className="w-3 h-3" />
          אושר
        </Badge>;
      case 'DECLINED':
        return <Badge variant="secondary" className="bg-red-100 text-red-800 flex items-center gap-1">
          <X className="w-3 h-3" />
          נדחה
        </Badge>;
      default:
        return null;
    }
  };

  const getPermissionStatus = (member: FamilyLinkWithPermissions, scope: FamilyScope) => {
    const request = member.permissions_requests?.find(
      req => req.permission_type === scope
    );
    return request?.status || 'NONE';
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">טוען רשימת בני משפחה...</p>
      </div>
    );
  }

  if (familyMembers.length === 0) {
    return (
      <div className="text-center py-8">
        <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">אין עדיין בני משפחה רשומים</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {familyMembers.map((member) => (
          <Card key={member.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{member.full_name}</h3>
                      {getStatusBadge(member.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{member.relation}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {member.permissions_requests?.map((req) => (
                        <Badge
                          key={req.id}
                          variant="outline"
                          className={
                            req.status === 'APPROVED'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : req.status === 'PENDING'
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }
                        >
                          {scopeLabels[req.permission_type as FamilyScope]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenPermissions(member)}
                  className="flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  ניהול הרשאות
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              ניהול הרשאות - {selectedMember?.full_name}
            </DialogTitle>
            <DialogDescription>
              אשר או דחה הרשאות עבור בן משפחה זה
            </DialogDescription>
          </DialogHeader>

          {selectedMember && (
            <div className="space-y-6 pt-4">
              {/* Family Link Status */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">סטטוס חברות במשפחה</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedMember.status === 'PENDING' && 'בקשת החברות ממתינה לאישור'}
                    {selectedMember.status === 'APPROVED' && 'חברות במשפחה אושרה'}
                    {selectedMember.status === 'DECLINED' && 'חברות במשפחה נדחתה'}
                  </p>
                </div>
                <div className="flex gap-2">
                  {selectedMember.status === 'PENDING' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleUpdateFamilyLink(selectedMember.id, 'APPROVED')}
                        disabled={isSaving}
                        className="flex items-center gap-1"
                      >
                        <Check className="w-4 h-4" />
                        אשר
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateFamilyLink(selectedMember.id, 'DECLINED')}
                        disabled={isSaving}
                        className="flex items-center gap-1"
                      >
                        <X className="w-4 h-4" />
                        דחה
                      </Button>
                    </>
                  )}
                  {selectedMember.status === 'APPROVED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateFamilyLink(selectedMember.id, 'DECLINED')}
                      disabled={isSaving}
                      className="flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      בטל אישור
                    </Button>
                  )}
                </div>
              </div>

              {/* Permissions */}
              <div className="space-y-3">
                <h3 className="font-medium">הרשאות מבוקשות</h3>
                {selectedMember.permissions_requests?.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    אין הרשאות מבוקשות
                  </p>
                ) : (
                  selectedMember.permissions_requests?.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">
                          {scopeLabels[request.permission_type as FamilyScope]}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(request.status)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {request.status === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleUpdatePermission(request.id, 'APPROVED')}
                              disabled={isSaving}
                              className="flex items-center gap-1"
                            >
                              <Check className="w-4 h-4" />
                              אשר
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdatePermission(request.id, 'DECLINED')}
                              disabled={isSaving}
                              className="flex items-center gap-1"
                            >
                              <X className="w-4 h-4" />
                              דחה
                            </Button>
                          </>
                        )}
                        {request.status === 'APPROVED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdatePermission(request.id, 'DECLINED')}
                            disabled={isSaving}
                            className="flex items-center gap-1"
                          >
                            <X className="w-4 h-4" />
                            בטל
                          </Button>
                        )}
                        {request.status === 'DECLINED' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdatePermission(request.id, 'APPROVED')}
                            disabled={isSaving}
                            className="flex items-center gap-1"
                          >
                            <Check className="w-4 h-4" />
                            אשר
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FamilyMembersListWithPermissions;
