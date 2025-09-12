import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Heart, ArrowRight, Clock, CalendarIcon } from 'lucide-react';
import { toast } from "sonner";
import { relationOptions, FamilyScope } from "@/types/family";
import { relationshipOptions, genderLabels } from "@/types/database";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ScopeSelector } from '@/components/ScopeSelector';

interface AuthSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialUserType?: 'main' | 'family';
}

export default function AuthSignupModal({ isOpen, onClose, initialUserType = 'main' }: AuthSignupModalProps) {
  const [userType, setUserType] = useState<'main' | 'family'>(initialUserType);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    relation: '',
    ownerEmail: '',
    birthDate: undefined as Date | undefined,
    gender: undefined as 'male' | 'female' | 'prefer_not_to_say' | undefined,
    relationshipToPrimary: ''
  });
  
  const [selectedScopes, setSelectedScopes] = useState<FamilyScope[]>(['POST_MEDIA']);

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      relation: '',
      ownerEmail: '',
      birthDate: undefined,
      gender: undefined,
      relationshipToPrimary: ''
    });
    setSelectedScopes(['POST_MEDIA']);
    setUserType(initialUserType);
    setCurrentStep(1);
    setIsLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateStep1 = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || 
        !formData.password.trim() || !formData.confirmPassword.trim()) {
      toast.error('יש למלא את כל השדות הנדרשים');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('הסיסמאות אינן תואמות');
      return false;
    }

    if (formData.password.length < 6) {
      toast.error('הסיסמה חייבת להכיל לפחות 6 תווים');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('כתובת האימייל אינה תקינה');
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    // בדיקת מגדר חובה לכל המשתמשים
    if (!formData.gender) {
      toast.error('יש לבחור מגדר');
      return false;
    }

    if (userType === 'family') {
      if (!formData.relation || !formData.ownerEmail.trim()) {
        toast.error('יש למלא את כל השדות הנדרשים');
        return false;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.ownerEmail)) {
        toast.error('כתובת אימייל המשתמש הראשי אינה תקינה');
        return false;
      }

      if (selectedScopes.length === 0) {
        toast.error('יש לבחור לפחות הרשאה אחת');
        return false;
      }
    }

    if (formData.phone && !/^[\d\-\s\+\(\)]+$/.test(formData.phone)) {
      toast.error('מספר הטלפון אינו תקין');
      return false;
    }

    return true;
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep2()) return;

    setIsLoading(true);
    
    try {
      if (userType === 'main') {
        // משתמש ראשי - צור חשבון ונווט לדשבורד
        console.log('Creating main user account:', {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone
        });
        
        toast.success('החשבון נוצר בהצלחה!');
        toast.info('מועבר לדשבורד הראשי...');
        
        // כאן נוסיף את הלוגיקה ליצירת משתמש ראשי
        // ונווט ל-/home
        
      } else {
        // בן משפחה - צור חשבון ושלח בקשה
        console.log('Creating family member account:', {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          relation: formData.relation,
          phone: formData.phone,
          ownerEmail: formData.ownerEmail,
          requestedScopes: selectedScopes
        });
        
        toast.success(`בקשת הצטרפות נשלחה בהצלחה ל-${formData.ownerEmail}`);
        toast.info('תקבל הודעה כאשר המשתמש הראשי יאשר את הבקשה');
        
        // כאן נוסיף את הלוגיקה ליצירת בן משפחה ושליחת בקשה
      }
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      handleClose();
      
    } catch (error) {
      toast.error('שגיאה בהרשמה');
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">הרשמה למערכת</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* בחירת סוג משתמש - רק אם לא מוגדר מראש */}
          {initialUserType === 'main' && (
            <div className="grid md:grid-cols-2 gap-4">
              <Card 
                className={`cursor-pointer transition-all ${userType === 'main' ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'}`}
                onClick={() => setUserType('main')}
              >
                <CardHeader className="text-center pb-3">
                  <CardTitle className="flex items-center justify-center gap-2 text-lg">
                    <Users className="w-5 h-5 text-primary" />
                    משתמש ראשי
                  </CardTitle>
                  <CardDescription className="text-sm">
                    ממשק מלא עם שליטה על המערכת
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card 
                className={`cursor-pointer transition-all ${userType === 'family' ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'}`}
                onClick={() => setUserType('family')}
              >
                <CardHeader className="text-center pb-3">
                  <CardTitle className="flex items-center justify-center gap-2 text-lg">
                    <Heart className="w-5 h-5 text-pink-600" />
                    בן משפחה
                  </CardTitle>
                  <CardDescription className="text-sm">
                    דשבורד משפחתי להשתתפות פעילה
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          )}

          {/* הודעה מיוחדת לבן משפחה */}
          {userType === 'family' && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <h4 className="font-medium text-amber-800">הרשמה כבן משפחה</h4>
              </div>
              <p className="text-sm text-amber-700">
                ההרשמה שלך תישלח לאישור על ידי המשתמש הראשי. תקבל הודעה כאשר הבקשה תאושר ותוכל להתחיל להשתמש במערכת.
              </p>
            </div>
          )}

          {/* Progress Indicator */}
          <div className="flex justify-center">
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 1 ? 'border-primary bg-primary text-white' : 'border-muted-foreground'}`}>
                  1
                </div>
                <span className="text-sm font-medium">פרטי חשבון</span>
              </div>
              <div className={`w-8 h-0.5 ${currentStep >= 2 ? 'bg-primary' : 'bg-muted-foreground'}`}></div>
              <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 2 ? 'border-primary bg-primary text-white' : 'border-muted-foreground'}`}>
                  2
                </div>
                <span className="text-sm font-medium">פרטים נוספים</span>
              </div>
            </div>
          </div>

          {/* Step 1: Basic Account Info */}
          {currentStep === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">שם פרטי *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="הזן שם פרטי"
                    required
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
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">אימייל *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
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
                  <Label htmlFor="confirmPassword">אימות סיסמה *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="הזן שוב את הסיסמה"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" className="px-8">
                  המשך
                  <ArrowRight className="mr-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          )}

          {/* Step 2: Additional Details */}
          {currentStep === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">טלפון {userType === 'family' ? '*' : '(אופציונלי)'}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="050-1234567"
                    required={userType === 'family'}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>תאריך לידה (אופציונלי)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !formData.birthDate && "text-muted-foreground"
                          )}
                        >
                          {formData.birthDate ? (
                            format(formData.birthDate, "dd/MM/yyyy")
                          ) : (
                            <span>בחר תאריך לידה</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.birthDate}
                          onSelect={(date) => setFormData(prev => ({ ...prev, birthDate: date }))}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
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

                  {userType === 'family' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="relation">קרבה משפחתית *</Label>
                        <Select 
                          value={formData.relation} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, relation: value }))}
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="בחר קרבה משפחתית" />
                          </SelectTrigger>
                          <SelectContent>
                            {relationOptions.map((relation) => (
                              <SelectItem key={relation} value={relation}>
                                {relation}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="relationshipToPrimary">מיהו בן המשפחה הזה עבורך? *</Label>
                        <Select 
                          value={formData.relationshipToPrimary} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, relationshipToPrimary: value }))}
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="בחר קשר משפחתי" />
                          </SelectTrigger>
                          <SelectContent>
                            {relationshipOptions.map((relationship) => (
                              <SelectItem key={relationship} value={relationship}>
                                {relationship}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          זה יעזור לנו להתאים הודעות מותאמות אישית
                        </p>
                      </div>

                    <div className="space-y-2">
                      <Label htmlFor="ownerEmail">אימייל של משתמש ראשי שאליו תרצה להתחבר *</Label>
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

                    <div className="border-t pt-4">
                      <ScopeSelector 
                        selectedScopes={selectedScopes}
                        onScopesChange={setSelectedScopes}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">מה יקרה לאחר ההרשמה?</h4>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span>הבקשה תישלח למשתמש הראשי</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                          <span>תקבל הודעה כאשר הבקשה תאושר</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span>לאחר אישור תוכל להתחיל להשתמש</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
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
                  {isLoading ? 'מרשם...' : 
                   userType === 'main' ? 'צור חשבון' : 'שלח בקשת הצטרפות'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}