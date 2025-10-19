import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, CheckCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { FamilyScope } from "@/types/family";
import { ScopeSelector } from '@/components/ScopeSelector';
import { supabase } from '@/integrations/supabase/client';

interface FamilyMemberSignupProps {
  onComplete: () => void;
  onBack: () => void;
}

export default function FamilyMemberSignup({ onComplete, onBack }: FamilyMemberSignupProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '', 
    password: '',
    confirmPassword: '',
    phone: '',
    ownerEmail: '',
    birthDay: '',
    birthMonth: '',
    birthYear: '',
    gender: undefined as 'male' | 'female' | undefined,
    relationshipToPrimary: '',
    customRelationship: ''
  });
  const [selectedScopes, setSelectedScopes] = useState<FamilyScope[]>(['POST_MEDIA']);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const getBirthDate = () => {
    if (formData.birthDay && formData.birthMonth && formData.birthYear) {
      return new Date(parseInt(formData.birthYear), parseInt(formData.birthMonth) - 1, parseInt(formData.birthDay));
    }
    return null;
  };

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1919 }, (_, i) => currentYear - i);

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim() || !formData.password.trim() || !formData.confirmPassword.trim()) {
      toast.error('יש למלא את כל השדות הנדרשים');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('הסיסמאות אינן תואמות');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('כתובת האימייל אינה תקינה');
      return;
    }

    setCurrentStep(2);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.phone.trim() || !formData.ownerEmail.trim() || !formData.relationshipToPrimary || !formData.gender) {
      toast.error('יש למלא את כל השדות הנדרשים');
      return;
    }

    if (formData.relationshipToPrimary === 'אחר' && !formData.customRelationship.trim()) {
      toast.error('יש לפרט את הקשר המשפחתי');
      return;
    }

    const phoneRegex = /^[\d\-\s\+\(\)]+$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error('מספר הטלפון אינו תקין');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.ownerEmail)) {
      toast.error('כתובת אימייל המשתמש הראשי אינה תקינה');
      return;
    }

    setCurrentStep(3);
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!Array.isArray(selectedScopes) || selectedScopes.length === 0) {
      toast.error('יש לבחור לפחות הרשאה אחת');
      return;
    }

    setIsLoading(true);

    try {
      // 1) יצירת משתמש ב-Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
            phone: formData.phone,
            birth_date: getBirthDate()?.toISOString().split('T')[0],
            is_family: true,
            // עדיין שומרים מטא-דאטה עבור טריגרים אחרים (כגון יצירת בקשות הרשאה אחרי אימות מייל)
            owner_email: formData.ownerEmail,
            ownerEmail: formData.ownerEmail,
            relation: (formData.relationshipToPrimary === 'אחר' ? formData.customRelationship : formData.relationshipToPrimary),
            relationship_to_primary_user: (formData.relationshipToPrimary === 'אחר' ? formData.customRelationship : formData.relationshipToPrimary),
            gender: formData.gender || '',
            selected_scopes: selectedScopes
          }
        }
      });

      if (authError) {
        toast.error(`שגיאה ביצירת חשבון: ${authError.message}`);
        return;
      }

      const newUserId = authData?.user?.id;
      if (!newUserId) {
        toast.error('שגיאה: לא התקבל מזהה משתמש חדש מהמערכת');
        return;
      }

      // 2) שליפת מזהה המשתמש הראשי לפי האימייל שהוזן
      const { data: ownerId, error: ownerLookupError } = await supabase.rpc('get_user_id_by_email', {
        email_address: formData.ownerEmail
      });

      if (ownerLookupError) {
        // ניסיון ניקוי משתמש במידה ונכשל חיפוש הבעלים
        await supabase.functions.invoke('cleanup-auth-user', { body: { user_id: newUserId } }).catch(() => {});
        toast.error('שגיאה בשליפת משתמש ראשי לפי אימייל. נסו שוב מאוחר יותר.');
        return;
      }

      if (!ownerId) {
        // בעלים לא נמצא – נבטל את המשתמש שנוצר
        await supabase.functions.invoke('cleanup-auth-user', { body: { user_id: newUserId } }).catch(() => {});
        toast.error('לא נמצא משתמש ראשי עם כתובת האימייל שסופקה. ההרשמה בוטלה.');
        return;
      }

      // 3) יצירת רשומת family_links ישירות מהקליינט
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
      const relationValue = (formData.relationshipToPrimary === 'אחר' ? formData.customRelationship : formData.relationshipToPrimary);

      const { error: linkError } = await supabase
        .from('family_links')
        .insert([
          {
            owner_user_id: ownerId,
            member_user_id: newUserId,
            full_name: fullName,
            email: formData.email,
            phone: formData.phone,
            relation: relationValue,
            relationship_to_primary_user: relationValue,
            gender: formData.gender,
            status: 'PENDING',
            scopes: selectedScopes,
            owner_email: formData.ownerEmail
          }
        ]);

      if (linkError) {
        // אם הוספת הקישור נכשלה – נמחק את המשתמש שנוצר כדי שלא יישאר יתום
        await supabase.functions.invoke('cleanup-auth-user', { body: { user_id: newUserId } }).catch(() => {});
        toast.error(`נכשלה יצירת הקישור למשתמש הראשי: ${linkError.message}`);
        return;
      }

      // 4) הצלחה – הודעה וניווט
      toast.success('נרשמת בהצלחה! אשר/י את המייל שלך ואז המשתמש הראשי יוכל לאשר את הבקשות שלך');
      setTimeout(() => onComplete(), 1500);

    } catch (error: any) {
      toast.error('אירעה שגיאה במהלך ההרשמה. נסו שוב.');
      console.error('Family member signup error:', error?.message || error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">הרשמה כבן משפחה</CardTitle>
          <CardDescription>
            הגש בקשה להצטרפות לחשבון משתמש ראשי קיים
          </CardDescription>
          <div className="flex justify-center mt-4">
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 1 ? 'border-primary bg-primary text-white' : 'border-muted-foreground'}`}>
                  {currentStep > 1 ? <CheckCircle className="w-4 h-4" /> : '1'}
                </div>
                <span className="text-sm font-medium">פרטי החשבון</span>
              </div>
              <div className={`w-6 h-0.5 ${currentStep >= 2 ? 'bg-primary' : 'bg-muted-foreground'}`}></div>
              <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 2 ? 'border-primary bg-primary text-white' : 'border-muted-foreground'}`}>
                  {currentStep > 2 ? <CheckCircle className="w-4 h-4" /> : '2'}
                </div>
                <span className="text-sm font-medium">פרטים אישיים</span>
              </div>
              <div className={`w-6 h-0.5 ${currentStep >= 3 ? 'bg-primary' : 'bg-muted-foreground'}`}></div>
              <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 3 ? 'border-primary bg-yellow-500 text-white' : 'border-muted-foreground'}`}>
                  {currentStep > 3 ? <CheckCircle className="w-4 h-4" /> : '3'}
                </div>
                <span className="text-sm font-medium">הרשאות</span>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {currentStep === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">כתובת אימייל *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your.email@example.com"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  כתובת האימייל תשמש למזהה החשבון שלך
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">סיסמה *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="לפחות 6 תווים"
                    required
                    className="pl-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">אישור סיסמה *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="הזן שוב את הסיסמה"
                    required
                    className="pl-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onBack}
                  className="flex-1"
                >
                  חזור לבחירה
                </Button>
                <Button type="submit" className="flex-1">
                  המשך
                  <ArrowRight className="mr-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          )}

          {currentStep === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-6">
              <div className="grid gap-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">שם פרטי *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="הזן שם פרטי"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">שם משפחה *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="הזן שם משפחה"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">מספר טלפון *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="050-1234567"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerEmail">אימייל המשתמש הראשי שאליו אתה רוצה להתחבר *</Label>
                  <Input
                    id="ownerEmail"
                    type="email"
                    value={formData.ownerEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, ownerEmail: e.target.value }))}
                    placeholder="owner@example.com"
                    required
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    הזן את כתובת האימייל של בן המשפחה שאליו אתה רוצה להצטרף
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>תאריך לידה (אופציונלי)</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">יום</Label>
                        <Select 
                          value={formData.birthDay} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, birthDay: value }))}
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="יום" />
                          </SelectTrigger>
                          <SelectContent>
                            {days.map((day) => (
                              <SelectItem key={day} value={day.toString()}>
                                {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">חודש</Label>
                        <Select 
                          value={formData.birthMonth} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, birthMonth: value }))}
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="חודש" />
                          </SelectTrigger>
                          <SelectContent>
                            {months.map((month, index) => (
                              <SelectItem key={index + 1} value={(index + 1).toString()}>
                                {month}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">שנה</Label>
                        <Select 
                          value={formData.birthYear} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, birthYear: value }))}
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="שנה" />
                          </SelectTrigger>
                          <SelectContent>
                            {years.map((year) => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">מגדר *</Label>
                    <Select 
                      value={formData.gender || ''} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value as 'male' | 'female' }))}
                      disabled={isLoading}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="בחר מגדר" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">זכר</SelectItem>
                        <SelectItem value="female">נקבה</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="relationshipToPrimary">קשר משפחתי *</Label>
                  <Select 
                    value={formData.relationshipToPrimary} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, relationshipToPrimary: value }))}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="בחר קשר משפחתי" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="בן">בן</SelectItem>
                      <SelectItem value="בת">בת</SelectItem>
                      <SelectItem value="נכד">נכד</SelectItem>
                      <SelectItem value="נכדה">נכדה</SelectItem>
                      <SelectItem value="אח">אח</SelectItem>
                      <SelectItem value="אחות">אחות</SelectItem>
                      <SelectItem value="דוד">דוד</SelectItem>
                      <SelectItem value="דודה">דודה</SelectItem>
                      <SelectItem value="אחר">אחר - מלא באופן חופשי</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {formData.relationshipToPrimary === 'אחר' && (
                    <div className="space-y-2 mt-2">
                      <Label htmlFor="customRelationship">פרט את סוג הקרבה המשפחתית *</Label>
                      <Input
                        id="customRelationship"
                        value={formData.customRelationship || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, customRelationship: e.target.value }))}
                        placeholder="למשל: חבר קרוב, שכן, מטפל..."
                        required
                        disabled={isLoading}
                      />
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    זה יעזור לנו להתאים הודעות מותאמות כמו "קיבלת הודעה מסבא"
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCurrentStep(1)}
                  disabled={isLoading}
                  className="flex-1"
                >
                  חזור
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="flex-1"
                >
                  המשך להרשאות
                  <ArrowRight className="mr-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          )}

          {currentStep === 3 && (
            <form onSubmit={handleStep3Submit} className="space-y-6">
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">בחר הרשאות עבור בן המשפחה</h3>
                  <p className="text-sm text-muted-foreground">לפחות הרשאה אחת חובה</p>
                </div>
                
                <ScopeSelector 
                  selectedScopes={selectedScopes}
                  onScopesChange={setSelectedScopes}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">מה יקרה לאחר השליחה?</h4>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5"></div>
                    <span>הבקשה תישלח למשתמש הראשי</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5"></div>
                    <span>המקבל יקבל הודעה בחשבון המאושר או בהודעה</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5"></div>
                    <span>לאחר אישור תוכל להתחבר למשפחה בעזרת החשבון שנוצר</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCurrentStep(2)}
                  disabled={isLoading}
                  className="flex-1"
                >
                  חזור
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? 'שולח בקשה...' : 'שלח בקשה להצטרפות'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
