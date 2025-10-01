import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, UserCircle, Shield, AlertCircle, Eye, EyeOff, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { FamilyScope, scopeLabels } from '@/types/family';

interface FamilyLinkData {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  relation: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'CANCELLED';
  scopes: FamilyScope[];
  owner_user_id: string;
}

export default function FamilyMemberProfile() {
  const navigate = useNavigate();
  const { authState } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [familyLink, setFamilyLink] = useState<FamilyLinkData | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    phone: ''
  });
  const [selectedScopes, setSelectedScopes] = useState<FamilyScope[]>([]);
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const allScopes: FamilyScope[] = ['POST_MEDIA', 'SUGGEST_REMINDER', 'INVITE_GAME', 'CHAT', 'EMERGENCY_ONLY', 'WAKE_UP_NOTIFICATION'];

  useEffect(() => {
    loadFamilyLink();
  }, [authState.user]);

  const loadFamilyLink = async () => {
    if (!authState.user) {
      toast.error('אנא התחבר כדי לצפות בפרופיל');
      navigate('/');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('family_links')
        .select('*')
        .eq('member_user_id', authState.user.id)
        .single();

      if (error) throw error;

      if (data) {
        setFamilyLink(data as FamilyLinkData);
        setFormData({
          email: data.email || '',
          phone: data.phone || ''
        });
        setSelectedScopes((data.scopes || []) as FamilyScope[]);
      }
    } catch (error: any) {
      console.error('Error loading family link:', error);
      toast.error('שגיאה בטעינת הפרופיל: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScopeChange = (scope: FamilyScope, checked: boolean) => {
    if (checked) {
      setSelectedScopes(prev => [...prev, scope]);
    } else {
      setSelectedScopes(prev => prev.filter(s => s !== scope));
    }
  };

  const handleSaveChanges = async () => {
    if (!familyLink) return;

    // Validation
    if (!formData.email.trim() || !formData.phone.trim()) {
      toast.error('יש למלא את כל השדות');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('כתובת האימייל אינה תקינה');
      return;
    }

    if (selectedScopes.length === 0) {
      toast.error('יש לבחור לפחות הרשאה אחת');
      return;
    }

    setIsSaving(true);
    try {
      // שמור את ההרשאות החדשות ב-family_links
      const { error: updateError } = await supabase
        .from('family_links')
        .update({ 
          email: formData.email,
          phone: formData.phone,
          scopes: selectedScopes,
          status: 'PENDING' // אם שינה הרשאות, חזור לממתין
        })
        .eq('id', familyLink.id);

      if (updateError) {
        console.error('Error updating permissions:', updateError);
        toast.error('שגיאה בעדכון ההרשאות');
        return;
      }

      toast.success('ההרשאות עודכנו ונשלחו לאישור');
      loadFamilyLink(); // Reload to get updated data
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('שגיאה לא צפויה');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!familyLink) return;

    if (!confirm('האם אתה בטוח שברצונך לבטל את הבקשה?')) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('family_links')
        .delete()
        .eq('id', familyLink.id);

      if (error) throw error;

      toast.success('הבקשה בוטלה');
      navigate('/');
    } catch (error: any) {
      console.error('Error canceling request:', error);
      toast.error('שגיאה בביטול הבקשה: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelMembership = async () => {
    if (!familyLink) return;

    if (!confirm('האם אתה בטוח שברצונך לבטל את החברות במשפחה?')) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('family_links')
        .update({ status: 'CANCELLED' })
        .eq('id', familyLink.id);

      if (error) throw error;

      toast.success('החברות בוטלה');
      loadFamilyLink();
    } catch (error: any) {
      console.error('Error canceling membership:', error);
      toast.error('שגיאה בביטול החברות: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResendRequest = async () => {
    if (!familyLink) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('family_links')
        .update({ status: 'PENDING' })
        .eq('id', familyLink.id);

      if (error) throw error;

      toast.success('הבקשה נשלחה מחדש');
      loadFamilyLink();
    } catch (error: any) {
      console.error('Error resending request:', error);
      toast.error('שגיאה בשליחת הבקשה מחדש: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">ממתין לאישור המשתמש הראשי</Badge>;
      case 'APPROVED':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">אושר על ידי המשתמש הראשי</Badge>;
      case 'DECLINED':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">נדחה על ידי המשתמש הראשי</Badge>;
      case 'CANCELLED':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">בוטל</Badge>;
      default:
        return null;
    }
  };

  const getScopeDescription = (scope: FamilyScope): string => {
    const descriptions = {
      POST_MEDIA: 'העלאת תמונות, וידאו וסיפורים לאישור',
      SUGGEST_REMINDER: 'הצעת תזכורות לאישור',
      INVITE_GAME: 'הזמנת משחקים משותפים',
      CHAT: 'השתתפות בצ\'אט המשפחה',
      EMERGENCY_ONLY: 'קבלת התראות חירום בלבד',
      WAKE_UP_NOTIFICATION: 'קבלת התראה כשהמשתמש הראשי מתעורר',
      POST_STORY: 'שיתוף סיפורים'
    };
    return descriptions[scope] || scope;
  };

  const handlePasswordChange = async () => {
    // Validation
    if (!newPassword.trim() || !confirmPassword.trim()) {
      toast.error('יש למלא את כל שדות הסיסמה');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('הסיסמה החדשה חייבת להכיל לפחות 6 תווים');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('הסיסמאות אינן תואמות');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success('הסיסמה עודכנה בהצלחה');
      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error('שגיאה בעדכון הסיסמה: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">טוען פרופיל...</p>
        </div>
      </div>
    );
  }

  if (!familyLink) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              לא נמצא פרופיל
            </CardTitle>
            <CardDescription>
              לא נמצאה בקשת חברות במשפחה עבור המשתמש הזה
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              חזור לדף הבית
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">הפרופיל שלי</h1>
            <p className="text-sm text-muted-foreground">ניהול הפרטים וההרשאות שלך</p>
          </div>
        </div>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                סטטוס הבקשה
              </CardTitle>
              {getStatusBadge(familyLink.status)}
            </div>
          </CardHeader>
        </Card>

        {/* Personal Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5" />
              פרטים אישיים
            </CardTitle>
            <CardDescription>המידע הבסיסי שלך במערכת</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>שם מלא</Label>
              <Input value={familyLink.full_name} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">לא ניתן לשינוי</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">טלפון</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label>קרבה משפחתית</Label>
              <Input value={familyLink.relation} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">לא ניתן לשינוי</p>
            </div>
          </CardContent>
        </Card>

        {/* Permissions Card */}
        <Card>
          <CardHeader>
            <CardTitle>הרשאות</CardTitle>
            <CardDescription>בחר את ההרשאות שתרצה לבקש מהמשתמש הראשי</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {allScopes.map((scope) => (
              <div key={scope} className="flex items-start gap-3 p-3 border rounded-lg">
                <Checkbox
                  id={scope}
                  checked={selectedScopes.includes(scope)}
                  onCheckedChange={(checked) => handleScopeChange(scope, checked as boolean)}
                  disabled={isSaving}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label htmlFor={scope} className="font-medium cursor-pointer">
                    {scopeLabels[scope]}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getScopeDescription(scope)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Password Change Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              עדכון סיסמה
            </CardTitle>
            <CardDescription>שנה את סיסמת הכניסה שלך</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">סיסמה נוכחית</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isSaving}
                  className="pl-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  disabled={isSaving}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">סיסמה חדשה</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="לפחות 6 תווים"
                  disabled={isSaving}
                  className="pl-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  disabled={isSaving}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">אימות סיסמה חדשה</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSaving}
                  className="pl-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isSaving}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button 
              onClick={handlePasswordChange} 
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? 'מעדכן...' : 'עדכן סיסמה'}
            </Button>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>פעולות</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={handleSaveChanges} 
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? 'שומר...' : 'שמור שינויים'}
            </Button>

            {familyLink.status === 'PENDING' && (
              <Button 
                variant="destructive" 
                onClick={handleCancelRequest}
                disabled={isSaving}
                className="w-full"
              >
                בטל בקשה
              </Button>
            )}

            {familyLink.status === 'APPROVED' && (
              <Button 
                variant="destructive" 
                onClick={handleCancelMembership}
                disabled={isSaving}
                className="w-full"
              >
                בטל חברות
              </Button>
            )}

            {familyLink.status === 'DECLINED' && (
              <Button 
                variant="default" 
                onClick={handleResendRequest}
                disabled={isSaving}
                className="w-full"
              >
                שלח בקשה מחדש
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
