import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, ArrowRight, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { relationLabels, genderLabels } from "@/types/database";
import { useDataProvider } from "@/providers/DataProvider";
import { DEV_MODE_DEMO } from "@/config/dev";

// Form schemas
const step1Schema = z.object({
  email: z.string().email("כתובת אימייל לא תקינה"),
  password: z.string().min(6, "הסיסמה חייבת להכיל לפחות 6 תווים"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "הסיסמאות אינן זהות",
  path: ["confirmPassword"],
});

const step2Schema = z.object({
  firstName: z.string().min(1, "שם פרטי הוא שדה חובה"),
  lastName: z.string().min(1, "שם משפחה הוא שדה חובה"),
  phone: z.string().regex(/^0[2-9]\d{8}$|^\+972[2-9]\d{8}$/, "מספר טלפון לא תקין (פורמט: 050-1234567)"),
  displayName: z.string().optional(),
  birthDay: z.string().optional(),
  birthMonth: z.string().optional(),
  birthYear: z.string().optional(),
  gender: z.enum(['male', 'female'], {
    required_error: "יש לבחור מגדר"
  })
}).refine((data) => {
  // אם אחד מהשדות של תאריך לידה מלא, כולם חייבים להיות מלאים
  const hasAnyBirthField = data.birthDay || data.birthMonth || data.birthYear;
  if (hasAnyBirthField) {
    return data.birthDay && data.birthMonth && data.birthYear;
  }
  return true;
}, {
  message: "אנא בחר/י תאריך לידה מלא או השאר את כל השדות ריקים",
  path: ["birthYear"],
});

const contactSchema = z.object({
  fullName: z.string().min(1, "שם מלא הוא שדה חובה"),
  relation: z.enum(['FAMILY', 'INSTITUTION', 'NEIGHBOR', 'CAREGIVER', 'OTHER'], {
    required_error: "יש לבחור קרבה"
  }),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "מספר טלפון לא תקין (חייב להיות בפורמט E.164)"),
  isEmergencyCandidate: z.boolean().default(false)
});

const step3Schema = z.object({
  contacts: z.array(contactSchema)
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

interface SignupWizardProps {
  onComplete: () => void;
}

export default function SignupWizard({ onComplete }: SignupWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null);
  const dataProvider = useDataProvider();

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: ""
    }
  });

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      displayName: "",
      birthDay: "",
      birthMonth: "",
      birthYear: "",
      gender: undefined
    }
  });

  // Helper function to create full birth date
  const getBirthDate = (data: Step2Data) => {
    if (data.birthDay && data.birthMonth && data.birthYear) {
      return new Date(parseInt(data.birthYear), parseInt(data.birthMonth) - 1, parseInt(data.birthDay));
    }
    return undefined;
  };

  // Generate arrays for dropdowns
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1919 }, (_, i) => currentYear - i);

  const step3Form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      contacts: []
    }
  });

  const addContact = () => {
    const currentContacts = step3Form.getValues('contacts');
    step3Form.setValue('contacts', [...currentContacts, {
      fullName: '',
      relation: 'FAMILY' as const,
      phone: '',
      isEmergencyCandidate: false
    }]);
  };

  const removeContact = (index: number) => {
    const currentContacts = step3Form.getValues('contacts');
    step3Form.setValue('contacts', currentContacts.filter((_, i) => i !== index));
  };

  const handleStep1Submit = async (data: Step1Data) => {
    setIsLoading(true);
    try {
      if (DEV_MODE_DEMO) {
        // In demo mode, skip auth and go to next step
        setStep1Data(data);
        setCurrentStep(2);
        toast.success("מצב דמו - נתונים מתקבלים");
      } else {
        // Real mode - use Supabase auth
        const { error } = await dataProvider.signUp(data.email, data.password);

        if (error) {
          toast.error(`שגיאה ביצירת החשבון: ${error.message}`);
          return;
        }

        setStep1Data(data);
        setCurrentStep(2);
        toast.success("החשבון נוצר בהצלחה! אנא המשך למילוי הפרופיל");
      }
    } catch (error) {
      toast.error("שגיאה לא צפויה");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2Submit = (data: Step2Data) => {
    setStep2Data(data);
    setCurrentStep(3);
  };

  const handleStep3Submit = async (data: Step3Data) => {
    if (!step2Data) return;
    
    setIsLoading(true);
    try {
      const profile = {
        firstName: step2Data.firstName,
        lastName: step2Data.lastName,
        displayName: step2Data.displayName || step2Data.firstName,
        birthDate: getBirthDate(step2Data),
        gender: step2Data.gender
      };

      const contacts = data.contacts.map(contact => ({
        fullName: contact.fullName,
        relation: contact.relation,
        phone: contact.phone,
        isEmergencyCandidate: contact.isEmergencyCandidate
      }));

      const { error } = await dataProvider.initAccount(profile, contacts);

      if (error) {
        toast.error(`שגיאה בשמירת הנתונים: ${error.message}`);
        return;
      }

      toast.success("ההרשמה הושלמה בהצלחה!");
      onComplete();
    } catch (error) {
      toast.error("שגיאה לא צפויה");
    } finally {
      setIsLoading(false);
    }
  };

  const getProgressValue = () => {
    return (currentStep / 3) * 100;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">הרשמה למערכת זהב</CardTitle>
          <CardDescription>
            אנא מלא/י את הפרטים שלך לצורך יצירת חשבון ראשי במערכת זהב
          </CardDescription>
          <CardDescription className="mt-2">
            שלב {currentStep} מתוך 3
          </CardDescription>
          <Progress value={getProgressValue()} className="mt-4" />
        </CardHeader>
        
        <CardContent>
          {currentStep === 1 && (
            <Form {...step1Form}>
              <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-4">
                <FormField
                  control={step1Form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>כתובת אימייל</FormLabel>
                      <FormControl>
                        <Input placeholder="name@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={step1Form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>סיסמה</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="לפחות 6 תווים" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={step1Form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>אישור סיסמה</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="הזן שוב את הסיסמה" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "יוצר חשבון..." : "המשך"}
                  <ArrowRight className="mr-2 h-4 w-4" />
                </Button>
              </form>
            </Form>
          )}

          {currentStep === 2 && (
            <Form {...step2Form}>
              <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-4">
                <FormField
                  control={step2Form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>שם פרטי *</FormLabel>
                      <FormControl>
                        <Input placeholder="הזן שם פרטי" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={step2Form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>שם משפחה *</FormLabel>
                      <FormControl>
                        <Input placeholder="הזן שם משפחה" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={step2Form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>מספר טלפון * (המזהה העיקרי)</FormLabel>
                      <FormControl>
                        <Input placeholder="050-1234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={step2Form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>שם תצוגה (אופציונלי)</FormLabel>
                      <FormControl>
                        <Input placeholder="ברירת מחדל: שם פרטי" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                
                <div className="space-y-2">
                  <FormLabel>תאריך לידה (אופציונלי)</FormLabel>
                  <div className="grid grid-cols-3 gap-2">
                    <FormField
                      control={step2Form.control}
                      name="birthDay"
                      render={({ field }) => (
                        <FormItem>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="בחר/י יום" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {days.map((day) => (
                                <SelectItem key={day} value={day.toString()}>
                                  {day}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={step2Form.control}
                      name="birthMonth"
                      render={({ field }) => (
                        <FormItem>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="בחר/י חודש" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {months.map((month, index) => (
                                <SelectItem key={index + 1} value={(index + 1).toString()}>
                                  {month}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={step2Form.control}
                      name="birthYear"
                      render={({ field }) => (
                        <FormItem>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="בחר/י שנה" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {years.map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <FormField
                  control={step2Form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>בחר מגדר *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="בחר מגדר" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">זכר</SelectItem>
                          <SelectItem value="female">נקבה</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setCurrentStep(1)}
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    חזור
                  </Button>
                  <Button type="submit" className="flex-1">
                    המשך
                    <ArrowRight className="mr-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {currentStep === 3 && (
            <Form {...step3Form}>
              <form onSubmit={step3Form.handleSubmit(handleStep3Submit)} className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold">אנשי קשר (אופציונלי אבל מומלץ)</h3>
                  <p className="text-sm text-muted-foreground">הוסף אנשי קשר שיוכלו לעזור לך במקרה חירום</p>
                </div>

                {step3Form.watch('contacts').map((_, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium">איש קשר {index + 1}</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeContact(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={step3Form.control}
                        name={`contacts.${index}.fullName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>שם מלא *</FormLabel>
                            <FormControl>
                              <Input placeholder="הזן שם מלא" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={step3Form.control}
                        name={`contacts.${index}.relation`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>קרבה *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="בחר קרבה" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(relationLabels).map(([key, label]) => (
                                  <SelectItem key={key} value={key}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={step3Form.control}
                        name={`contacts.${index}.phone`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>טלפון נייד *</FormLabel>
                            <FormControl>
                              <Input placeholder="+972501234567" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={step3Form.control}
                        name={`contacts.${index}.isEmergencyCandidate`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                בקש איש קשר חירום
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </Card>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addContact}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  הוסף איש קשר
                </Button>

                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setCurrentStep(2)}
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    חזור
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading ? "שומר..." : "סיים הרשמה"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}