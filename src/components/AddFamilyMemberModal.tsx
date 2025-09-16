import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FamilyScope, relationOptions } from '@/types/family';
import { useFamilyProvider } from '@/providers/FamilyProvider';
import { ScopeSelector } from '@/components/ScopeSelector';
import { toast } from 'sonner';

interface AddFamilyMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddFamilyMemberModal = ({ isOpen, onClose }: AddFamilyMemberModalProps) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    relation: '',
    phone: '',
    email: '',
    ownerEmail: '',
  });
  const [selectedScopes, setSelectedScopes] = useState<FamilyScope[]>(['POST_MEDIA']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { addFamilyMember } = useFamilyProvider();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.relation || !formData.phone.trim() || !formData.email.trim() || !formData.ownerEmail.trim()) {
      toast.error('יש למלא את כל השדות הנדרשים');
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

    // Basic email validation for family member
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('כתובת האימייל אינה תקינה');
      return;
    }

    // Basic email validation for owner
    if (!emailRegex.test(formData.ownerEmail)) {
      toast.error('כתובת אימייל המשתמש הראשי אינה תקינה');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Add family member with PENDING status
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      const result = addFamilyMember({
        full_name: fullName,
        relationship_label: formData.relation,
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        gender: 'male',
        status: 'PENDING',
        scopes: selectedScopes
      });

      if (result) {
        toast.success(`בן משפחה נוסף בהצלחה: ${fullName}`);
        toast.success(`הזמנה נשלחה בהצלחה ל${fullName}`);
        
        // Reset form
        setFormData({
        firstName: '',
        lastName: '',
        relation: '',
        phone: '',
        email: '',
        ownerEmail: '',
      });
      setSelectedScopes(['POST_MEDIA']);
      onClose();
      
    } catch (error) {
      toast.error('שגיאה בשליחת ההזמנה');
      console.error('Error adding family member:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">הוסף בן משפחה חדש</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="relation">קרבה משפחתית *</Label>
              <Select 
                value={formData.relation} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, relation: value }))}
                disabled={isSubmitting}
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
              <Label htmlFor="email">כתובת אימייל *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="example@gmail.com"
                required
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                כתובת האימייל תשמש כמזהה לחיבור למערכת
              </p>
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
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                הזן את כתובת האימייל של המשתמש הראשי אליו תרצה להתחבר
              </p>
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
                disabled={isSubmitting}
              />
            </div>

            {/* Status Display */}
            <div className="space-y-2 p-4 bg-muted rounded-lg">
              <Label>סטטוס אישור</Label>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-sm text-muted-foreground">ממתין לאישור מהמשתמש הראשי</span>
              </div>
              <p className="text-xs text-muted-foreground">
                לאחר שליחת הבקשה, המשתמש הראשי יקבל הודעה ויוכל לאשר או לדחות את הבקשה
              </p>
            </div>
          </div>

          {/* Scopes Selection */}
          <div className="border-t pt-6">
            <ScopeSelector 
              selectedScopes={selectedScopes}
              onScopesChange={setSelectedScopes}
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter className="flex gap-3 pt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              ביטול
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? 'שולח...' : 'שלח הזמנה'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};