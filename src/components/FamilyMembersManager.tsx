import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, Edit, Mail, Phone, Trash2 } from 'lucide-react';
import { useFamilyMembers, FamilyMember } from '@/hooks/useFamilyMembers';

const relationshipOptions = [
  'אבא', 'אמא', 'סבא', 'סבתא', 'בן', 'בת', 'אח', 'אחות',
  'דוד', 'דודה', 'נכד', 'נכדה', 'חבר', 'חברה', 'אחר'
];

export const FamilyMembersManager = () => {
  const { familyMembers, loading, addFamilyMember, updateFamilyMember, deleteFamilyMember } = useFamilyMembers();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    relationship_label: '',
    gender: '' as 'male' | 'female' | '',
    phone: ''
  });

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      relationship_label: '',
      gender: '',
      phone: ''
    });
    setEditingMember(null);
  };

  const openEditModal = (member: FamilyMember) => {
    setFormData({
      full_name: member.full_name,
      email: member.email,
      relationship_label: member.relationship_label,
      gender: member.gender,
      phone: member.phone || ''
    });
    setEditingMember(member);
    setIsAddModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.full_name || !formData.email || !formData.relationship_label || !formData.gender) {
      return;
    }

    const memberData = {
      full_name: formData.full_name,
      email: formData.email,
      relationship_label: formData.relationship_label,
      gender: formData.gender as 'male' | 'female',
      phone: formData.phone,
      status: 'ACTIVE' as const
    };

    let success = false;
    if (editingMember) {
      success = await updateFamilyMember(editingMember.id, memberData) !== null;
    } else {
      success = await addFamilyMember(memberData) !== null;
    }

    if (success) {
      setIsAddModalOpen(false);
      resetForm();
    }
  };

  const handleDelete = async (member: FamilyMember) => {
    if (confirm(`האם אתה בטוח שברצונך למחוק את ${member.full_name}?`)) {
      await deleteFamilyMember(member.id);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center">
          <div className="text-lg">טוען בני משפחה...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">ניהול בני משפחה</h1>
            <p className="text-muted-foreground">הוסף ונהל את רשימת בני המשפחה שלך</p>
          </div>
        </div>

        <Dialog open={isAddModalOpen} onOpenChange={(open) => {
          setIsAddModalOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              הוסף בן משפחה
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingMember ? 'עריכת בן משפחה' : 'הוספת בן משפחה חדש'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">שם מלא *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="הזן שם מלא"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">כתובת אימייל *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="example@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="relationship">קשר משפחתי *</Label>
                <Select 
                  value={formData.relationship_label} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, relationship_label: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר קשר משפחתי" />
                  </SelectTrigger>
                  <SelectContent>
                    {relationshipOptions.map((relation) => (
                      <SelectItem key={relation} value={relation}>
                        {relation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">מגדר *</Label>
                <Select 
                  value={formData.gender} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value as 'male' | 'female' }))}
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

              <div className="space-y-2">
                <Label htmlFor="phone">טלפון (אופציונלי)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="050-1234567"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleSubmit}
                  className="flex-1"
                  disabled={!formData.full_name || !formData.email || !formData.relationship_label || !formData.gender}
                >
                  {editingMember ? 'עדכן' : 'הוסף'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAddModalOpen(false);
                    resetForm();
                  }}
                  className="flex-1"
                >
                  ביטול
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {familyMembers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">אין בני משפחה</h3>
            <p className="text-muted-foreground text-center mb-4">
              הוסף בני משפחה כדי שיוכלו לקבל הודעות מהמערכת
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {familyMembers.map((member) => (
            <Card key={member.id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span>{member.full_name}</span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditModal(member)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(member)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  <strong>קשר משפחתי:</strong> {member.relationship_label}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4" />
                  {member.email}
                </div>
                {member.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4" />
                    {member.phone}
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  <strong>מגדר:</strong> {member.gender === 'male' ? 'זכר' : 'נקבה'}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};