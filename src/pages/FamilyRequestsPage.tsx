import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Clock, Users, ArrowLeft } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/FixedAuthProvider';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface FamilyRequest {
  id: string;
  full_name: string;
  email: string;
  relation: string;
  phone: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED';
  created_at: string;
  scopes: string[];
  member_user_id?: string;
}

const FamilyRequestsPage = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<FamilyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (authState.role !== 'MAIN_USER') {
      navigate('/');
      return;
    }
    fetchRequests();
  }, [authState.role, navigate]);

  const fetchRequests = async () => {
    try {
      if (!authState.user) return;

        // Get user profile to find their email
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('email')
          .eq('user_id', authState.user.id)
          .single();

        const userEmail = profile?.email || authState.user.email;
        
        const { data: familyLinks, error } = await supabase
          .from('family_links')
          .select('*')
          .eq('owner_email', userEmail)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching family requests:', error);
          toast.error('שגיאה בטעינת בקשות המשפחה');
          return;
        }

        setRequests((familyLinks || []) as FamilyRequest[]);
    } catch (error) {
      console.error('Error in fetchRequests:', error);
      toast.error('שגיאה בטעינת בקשות המשפחה');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      // Approve the link and claim ownership
      const { data: updated, error } = await supabase
        .from('family_links')
        .update({ 
          status: 'APPROVED',
          owner_user_id: authState.user?.id 
        })
        .eq('id', requestId)
        .select('member_user_id')
        .maybeSingle();

      if (error) {
        console.error('Error approving request:', error);
        toast.error('שגיאה באישור הבקשה');
        return;
      }

      // Ensure the approved member has the correct "family_member" role
      if (updated?.member_user_id) {
        const { error: roleErr } = await supabase
          .from('user_roles')
          .upsert(
            [{ user_id: updated.member_user_id, role: 'family_member', granted_by_user_id: authState.user?.id || null }],
            { onConflict: 'user_id,role', ignoreDuplicates: true }
          );
        if (roleErr) {
          console.warn('Failed to upsert family_member role (non-blocking):', roleErr);
        }
      }

      toast.success('הבקשה אושרה בהצלחה');
      fetchRequests(); // Refresh the list
    } catch (error) {
      console.error('Error in handleApprove:', error);
      toast.error('שגיאה באישור הבקשה');
    } finally {
      setActionLoading(null);
    }
  };
  const handleDecline = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const { error } = await supabase
        .from('family_links')
        .update({ status: 'DECLINED' })
        .eq('id', requestId);

      if (error) {
        console.error('Error declining request:', error);
        toast.error('שגיאה בדחיית הבקשה');
        return;
      }

      toast.success('הבקשה נדחתה');
      fetchRequests(); // Refresh the list
    } catch (error) {
      console.error('Error in handleDecline:', error);
      toast.error('שגיאה בדחיית הבקשה');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 ml-1" />
            ממתין לאישור
          </Badge>
        );
      case 'APPROVED':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 ml-1" />
            אושר
          </Badge>
        );
      case 'DECLINED':
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 ml-1" />
            נדחה
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">טוען בקשות...</div>
        </div>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const processedRequests = requests.filter(r => r.status !== 'PENDING');

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">בקשות הצטרפות לחשבון המשפחה</h1>
                <p className="text-muted-foreground">
                  כאן תוכל לאשר או לדחות בני משפחה שביקשו להצטרף לחשבון שלך
                </p>
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/home')}>
            <ArrowLeft className="w-4 h-4 ml-2" />
            חזור לעמוד הראשי
          </Button>
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                בקשות ממתינות לאישור ({pendingRequests.length})
              </CardTitle>
              <CardDescription>
                רק משתמשים שאושרו יוכלו לפעול בתוך המערכת
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>שם מלא</TableHead>
                      <TableHead>אימייל</TableHead>
                      <TableHead>קרבה משפחתית</TableHead>
                      <TableHead>טלפון</TableHead>
                      <TableHead>תאריך בקשה</TableHead>
                      <TableHead>פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.full_name}</TableCell>
                        <TableCell>{request.email}</TableCell>
                        <TableCell>{request.relation}</TableCell>
                        <TableCell>{request.phone}</TableCell>
                        <TableCell>{formatDate(request.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(request.id)}
                              disabled={actionLoading === request.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-3 h-3 ml-1" />
                              {actionLoading === request.id ? 'מאשר...' : 'אשר'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDecline(request.id)}
                              disabled={actionLoading === request.id}
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <XCircle className="w-3 h-3 ml-1" />
                              {actionLoading === request.id ? 'דוחה...' : 'דחה'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Processed Requests */}
        {processedRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>בקשות שטופלו ({processedRequests.length})</CardTitle>
              <CardDescription>
                היסטוריית בקשות שאושרו או נדחו
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>שם מלא</TableHead>
                      <TableHead>אימייל</TableHead>
                      <TableHead>קרבה משפחתית</TableHead>
                      <TableHead>סטטוס</TableHead>
                      <TableHead>תאריך בקשה</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.full_name}</TableCell>
                        <TableCell>{request.email}</TableCell>
                        <TableCell>{request.relation}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>{formatDate(request.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Requests */}
        {requests.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">אין בקשות הצטרפות</h3>
                  <p className="text-muted-foreground">
                    עדיין לא התקבלו בקשות הצטרפות לחשבון המשפחה שלך
                  </p>
                </div>
                <Alert>
                  <AlertDescription>
                    כאשר בן משפחה ירצה להצטרף אליך, הוא יזין את כתובת האימייל שלך בטופס ההרשמה
                    והבקשה תופיע כאן לאישור או דחייה
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FamilyRequestsPage;