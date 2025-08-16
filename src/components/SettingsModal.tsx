import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, User, Users, Building2 } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  phone: string;
  isEmergencyContact: boolean;
}

interface InstitutionalContact {
  id: string;
  name: string;
  phone: string;
  role: string;
}

interface SettingsData {
  userName: string;
  children: Contact[];
  grandchildren: Contact[];
  institutionalContacts: InstitutionalContact[];
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SettingsData;
  onSave: (settings: SettingsData) => void;
}

const SettingsModal = ({ isOpen, onClose, settings, onSave }: SettingsModalProps) => {
  const [localSettings, setLocalSettings] = useState<SettingsData>(settings);

  const addContact = (type: 'children' | 'grandchildren') => {
    setLocalSettings(prev => ({
      ...prev,
      [type]: [...prev[type], {
        id: Date.now().toString(),
        name: '',
        phone: '',
        isEmergencyContact: false
      }]
    }));
  };

  const addInstitutionalContact = () => {
    setLocalSettings(prev => ({
      ...prev,
      institutionalContacts: [...prev.institutionalContacts, {
        id: Date.now().toString(),
        name: '',
        phone: '',
        role: ''
      }]
    }));
  };

  const updateContact = (type: 'children' | 'grandchildren', id: string, field: keyof Contact, value: string | boolean) => {
    setLocalSettings(prev => ({
      ...prev,
      [type]: prev[type].map(contact =>
        contact.id === id ? { ...contact, [field]: value } : contact
      )
    }));
  };

  const updateInstitutionalContact = (id: string, field: keyof InstitutionalContact, value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      institutionalContacts: prev.institutionalContacts.map(contact =>
        contact.id === id ? { ...contact, [field]: value } : contact
      )
    }));
  };

  const removeContact = (type: 'children' | 'grandchildren', id: string) => {
    setLocalSettings(prev => ({
      ...prev,
      [type]: prev[type].filter(contact => contact.id !== id)
    }));
  };

  const removeInstitutionalContact = (id: string) => {
    setLocalSettings(prev => ({
      ...prev,
      institutionalContacts: prev.institutionalContacts.filter(contact => contact.id !== id)
    }));
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto rtl-text">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">הגדרות אישיות</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Name */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                שם המשתמש
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="userName">השם שיוצג במסך הראשי</Label>
              <Input
                id="userName"
                value={localSettings.userName}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, userName: e.target.value }))}
                placeholder="הכנס את השם שלך"
                className="mt-2"
              />
            </CardContent>
          </Card>

          {/* Children */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                ילדים
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {localSettings.children.map((child) => (
                <div key={child.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                  <div>
                    <Label>שם</Label>
                    <Input
                      value={child.name}
                      onChange={(e) => updateContact('children', child.id, 'name', e.target.value)}
                      placeholder="שם הילד/ה"
                    />
                  </div>
                  <div>
                    <Label>טלפון</Label>
                    <Input
                      value={child.phone}
                      onChange={(e) => updateContact('children', child.id, 'phone', e.target.value)}
                      placeholder="מספר טלפון"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`emergency-${child.id}`}
                      checked={child.isEmergencyContact}
                      onCheckedChange={(checked) => updateContact('children', child.id, 'isEmergencyContact', checked)}
                    />
                    <Label htmlFor={`emergency-${child.id}`} className="text-sm">
                      איש קשר לחירום
                    </Label>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeContact('children', child.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button onClick={() => addContact('children')} variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                הוסף ילד/ה
              </Button>
            </CardContent>
          </Card>

          {/* Grandchildren */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                נכדים ונינים
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {localSettings.grandchildren.map((grandchild) => (
                <div key={grandchild.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                  <div>
                    <Label>שם</Label>
                    <Input
                      value={grandchild.name}
                      onChange={(e) => updateContact('grandchildren', grandchild.id, 'name', e.target.value)}
                      placeholder="שם הנכד/ה"
                    />
                  </div>
                  <div>
                    <Label>טלפון</Label>
                    <Input
                      value={grandchild.phone}
                      onChange={(e) => updateContact('grandchildren', grandchild.id, 'phone', e.target.value)}
                      placeholder="מספר טלפון (אופציונלי)"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`emergency-gc-${grandchild.id}`}
                      checked={grandchild.isEmergencyContact}
                      onCheckedChange={(checked) => updateContact('grandchildren', grandchild.id, 'isEmergencyContact', checked)}
                    />
                    <Label htmlFor={`emergency-gc-${grandchild.id}`} className="text-sm">
                      איש קשר לחירום
                    </Label>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeContact('grandchildren', grandchild.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button onClick={() => addContact('grandchildren')} variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                הוסף נכד/ה
              </Button>
            </CardContent>
          </Card>

          {/* Institutional Contacts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                אנשי קשר מוסדיים
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {localSettings.institutionalContacts.map((contact) => (
                <div key={contact.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                  <div>
                    <Label>שם</Label>
                    <Input
                      value={contact.name}
                      onChange={(e) => updateInstitutionalContact(contact.id, 'name', e.target.value)}
                      placeholder="שם איש הקשר"
                    />
                  </div>
                  <div>
                    <Label>תפקיד/מוסד</Label>
                    <Input
                      value={contact.role}
                      onChange={(e) => updateInstitutionalContact(contact.id, 'role', e.target.value)}
                      placeholder="אחות, דיור מוגן, וכו'"
                    />
                  </div>
                  <div>
                    <Label>טלפון</Label>
                    <Input
                      value={contact.phone}
                      onChange={(e) => updateInstitutionalContact(contact.id, 'phone', e.target.value)}
                      placeholder="מספר טלפון"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeInstitutionalContact(contact.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button onClick={addInstitutionalContact} variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                הוסף איש קשר מוסדי
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-6">
          <Button onClick={handleSave} className="flex-1">
            שמור הגדרות
          </Button>
          <Button onClick={onClose} variant="outline" className="flex-1">
            ביטול
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;