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
    fullName: '',
    relation: '',
    phone: '',
  });
  const [selectedScopes, setSelectedScopes] = useState<FamilyScope[]>(['POST_MEDIA']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { addFamilyMember } = useFamilyProvider();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName.trim() || !formData.relation || !formData.phone.trim()) {
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

    setIsSubmitting(true);
    
    try {
      // Add family member with PENDING status
      addFamilyMember({
        fullName: formData.fullName.trim(),
        relation: formData.relation,
        phone: formData.phone.trim(),
        status: 'PENDING',
        scopes: selectedScopes,
      });

      toast.success(`הזמנה נשלחה בהצלחה ל${formData.fullName}`);
      
      // Reset form
      setFormData({
        fullName: '',
        relation: '',
        phone: '',
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
            <div className="space-y-2">
              <Label htmlFor="fullName">שם מלא *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="הזן שם מלא"
                required
                disabled={isSubmitting}
              />
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
              <p className="text-xs text-muted-foreground">
                מספר הטלפון ישמש כמזהה לחיבור למערכת
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