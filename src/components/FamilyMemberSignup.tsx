import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { relationOptions, FamilyScope, scopeLabels } from "@/types/family";
import { relationshipOptions, genderLabels } from "@/types/database";
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

  // Helper function to create full birth date
  const getBirthDate = () => {
    if (formData.birthDay && formData.birthMonth && formData.birthYear) {
      return new Date(parseInt(formData.birthYear), parseInt(formData.birthMonth) - 1, parseInt(formData.birthDay));
    }
    return null;
  };

  // Generate arrays for dropdowns
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

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('כתובת האימייל אינה תקינה');
      return;
    }

    setCurrentStep(2);
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.phone.trim() || !formData.ownerEmail.trim() || !formData.relationshipToPrimary || !formData.gender) {
      toast.error('יש למלא את כל השדות הנדרשים');
      return;
    }

    if (formData.relationshipToPrimary === 'אחר' && !formData.customRelationship.trim()) {
      toast.error('יש לפרט את הקשר המשפחתי');
      return;
    }

    if (selectedScopes.length === 0) {
      toast.error('יש לבחור לפחות הרשאה אחת');
      return;
    }

    // Basic phone validation
    const phoneRegex = /^[\d\-\s\+\(\)]+$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error('מספר הטלפון אינו תקין');
      return;
    }

    // Basic email validation for owner
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.ownerEmail)) {
      toast.error('כתובת אימייל המשתמש הראשי אינה תקינה');
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
            phone: formData.phone,
            birth_date: getBirthDate()?.toISOString().split('T')[0] // YYYY-MM-DD format
          }
        }
      });

      if (error) {
        throw error;
      }

      // Create family link request
      const finalRelationship = formData.relationshipToPrimary === 'אחר' 
        ? formData.customRelationship 
        : formData.relationshipToPrimary;

      const { error: linkError } = await supabase
        .from('family_links')
        .insert({
          full_name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
          email: formData.email,
          relation: finalRelationship,
          phone: formData.phone,
          owner_email: formData.ownerEmail,
          member_user_id: data.user?.id,
          scopes: selectedScopes,
          status: 'PENDING',
          relationship_to_primary_user: finalRelationship,
          gender: formData.gender
        });

      if (linkError) {
        console.error('Error creating family link:', linkError);
        throw new Error(`שגיאה ביצירת קשר משפחתי: ${linkError.message}`);
      }
      
      toast.success(`בקשת הצטרפות נשלחה בהצלחה ל${formData.ownerEmail}`);
      toast.info('תקבל הודעה כאשר המשתמש הראשי יאשר את הבקשה');
      
      onComplete();
      
    } catch (error) {
      toast.error('שגיאה בשליחת הבקשה');
      console.error('Error creating family member:', error);
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
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 1 ? 'border-primary bg-primary text-white' : 'border-muted-foreground'}`}>
                  {currentStep > 1 ? <CheckCircle className="w-4 h-4" /> : '1'}
                </div>
                <span className="text-sm font-medium">פרטי החשבון</span>
              </div>
              <div className={`w-8 h-0.5 ${currentStep >= 2 ? 'bg-primary' : 'bg-muted-foreground'}`}></div>
              <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 2 ? 'border-primary bg-primary text-white' : 'border-muted-foreground'}`}>
                  {currentStep > 2 ? <CheckCircle className="w-4 h-4" /> : '2'}
                </div>
                <span className="text-sm font-medium">פרטים אישיים</span>
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
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="לפחות 6 תווים"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">אישור סיסמה *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="הזן שוב את הסיסמה"
                  required
                />
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
              {/* Personal Information */}
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
                  <Label htmlFor="ownerEmail">אימייל משתמש ראשי *</Label>
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
                    הזן את כתובת האימייל של המשתמש הראשי אליו תרצה להתחבר
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
                          <SelectValue placeholder="בחר/י יום" />
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
                          <SelectValue placeholder="בחר/י חודש" />
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
                          <SelectValue placeholder="בחר/י שנה" />
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

                <div className="space-y-2">
                  <Label htmlFor="gender">בחר מגדר *</Label>
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
                  <Label htmlFor="relationshipToPrimary">מיהו בן המשפחה הזה עבורך? (קשר משפחתי) *</Label>
                  <Select 
                    value={formData.relationshipToPrimary} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, relationshipToPrimary: value }))}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="בחר קשר משפחתי" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="אבא">אבא</SelectItem>
                      <SelectItem value="אמא">אמא</SelectItem>
                      <SelectItem value="סבא">סבא</SelectItem>
                      <SelectItem value="סבתא">סבתא</SelectItem>
                      <SelectItem value="דוד / דודה">דוד / דודה</SelectItem>
                      <SelectItem value="מטופל / מטופלת">מטופל / מטופלת</SelectItem>
                      <SelectItem value="אחר">אחר</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {formData.relationshipToPrimary === 'אחר' && (
                    <div className="space-y-2">
                      <Label htmlFor="customRelationship">פרט את הקשר המשפחתי *</Label>
                      <Input
                        id="customRelationship"
                        value={formData.customRelationship || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, customRelationship: e.target.value }))}
                        placeholder="הזן קשר משפחתי מותאם"
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

              {/* Scopes Selection */}
              <div className="border-t pt-6">
                <ScopeSelector 
                  selectedScopes={selectedScopes}
                  onScopesChange={setSelectedScopes}
                  disabled={isLoading}
                />
              </div>

              {/* Status Display */}
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <Label>מה יקרה לאחר השליחה?</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm">הבקשה תישלח למשתמש הראשי</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-sm">תקבל הודעה כאשר הבקשה תאושר או תידחה</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm">לאחר אישור תוכל להתחיל להשתמש במערכת</span>
                  </div>
                </div>
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
                  {isLoading ? 'שולח בקשה...' : 'שלח בקשת הצטרפות'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}