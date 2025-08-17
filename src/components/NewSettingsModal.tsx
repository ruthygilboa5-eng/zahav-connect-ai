import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  User, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Send, 
  Phone,
  Shield,
  ShieldCheck,
  ShieldX,
  Clock,
  Save,
  X
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useContacts } from '@/hooks/useContacts';
import { Contact, relationLabels } from '@/types/database';

interface NewSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NewSettingsModal = ({ isOpen, onClose }: NewSettingsModalProps) => {
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const { contacts, loading: contactsLoading, addContact, updateContact, deleteContact, sendEmergencyRequest } = useContacts();
  
  // Profile form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  // Contact form state
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [contactForm, setContactForm] = useState({
    full_name: '',
    relation: 'FAMILY' as Contact['relation'],
    phone: '',
    sendEmergencyRequest: false
  });

  // Initialize profile form when profile data loads
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name);
      setLastName(profile.last_name);
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      return;
    }

    const success = await updateProfile({
      first_name: firstName.trim(),
      last_name: lastName.trim()
    });

    if (success) {
      // Profile updated successfully
    }
  };

  const handleAddContact = () => {
    setContactForm({
      full_name: '',
      relation: 'FAMILY',
      phone: '',
      sendEmergencyRequest: false
    });
    setEditingContact(null);
    setIsAddingContact(true);
  };

  const handleEditContact = (contact: Contact) => {
    setContactForm({
      full_name: contact.full_name,
      relation: contact.relation,
      phone: contact.phone,
      sendEmergencyRequest: false
    });
    setEditingContact(contact);
    setIsAddingContact(true);
  };

  const handleSaveContact = async () => {
    if (!contactForm.full_name.trim() || !contactForm.phone.trim()) {
      return;
    }

    let success = false;

    if (editingContact) {
      // Update existing contact
      success = await updateContact(editingContact.id, {
        full_name: contactForm.full_name.trim(),
        relation: contactForm.relation,
        phone: contactForm.phone.trim()
      });
    } else {
      // Add new contact
      success = await addContact({
        full_name: contactForm.full_name.trim(),
        relation: contactForm.relation,
        phone: contactForm.phone.trim(),
        is_emergency_candidate: false,
        emergency_status: 'NONE'
      });

      // If contact was added and user wants to send emergency request
      if (success && contactForm.sendEmergencyRequest) {
        // Find the newly added contact (it will be first in the list)
        setTimeout(async () => {
          const newContact = contacts[0];
          if (newContact) {
            await handleSendEmergencyRequest(newContact.id);
          }
        }, 500);
      }
    }

    if (success) {
      setIsAddingContact(false);
      setEditingContact(null);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    await deleteContact(contactId);
  };

  const handleSendEmergencyRequest = async (contactId: string) => {
    await sendEmergencyRequest(contactId);
  };

  const handleRevokeEmergencyStatus = async (contactId: string) => {
    await updateContact(contactId, { 
      is_emergency_candidate: false,
      emergency_status: 'NONE' 
    });
  };

  const getEmergencyStatusColor = (status: Contact['emergency_status']) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500 text-white';
      case 'APPROVED': return 'bg-green-500 text-white';
      case 'DECLINED': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getEmergencyStatusText = (status: Contact['emergency_status']) => {
    switch (status) {
      case 'PENDING': return 'ממתין לאישור';
      case 'APPROVED': return 'מאושר';
      case 'DECLINED': return 'נדחה';
      default: return 'לא פעיל';
    }
  };

  const getEmergencyStatusIcon = (status: Contact['emergency_status']) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'APPROVED': return <ShieldCheck className="w-4 h-4" />;
      case 'DECLINED': return <ShieldX className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rtl-text">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <User className="w-6 h-6" />
            הגדרות ואנשי קשר
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              פרופיל משתמש
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              אנשי קשר
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>פרטים אישיים</CardTitle>
                <CardDescription>
                  עדכן את שמך הפרטי והמשפחה. השם הפרטי יוצג במסך הראשי
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">שם פרטי *</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="הכנס שם פרטי"
                      disabled={profileLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">שם משפחה *</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="הכנס שם משפחה"
                      disabled={profileLoading}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    onClick={handleSaveProfile}
                    disabled={profileLoading || !firstName.trim() || !lastName.trim()}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    שמור שינויים
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">אנשי קשר</h3>
                <p className="text-sm text-muted-foreground">
                  נהל את רשימת אנשי הקשר שלך ושלח בקשות לאישור חירום
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  // Clear all contacts data
                  contacts.forEach(contact => deleteContact(contact.id));
                }}>
                  רקן נתונים
                </Button>
                <Button onClick={handleAddContact}>
                  <Plus className="w-4 h-4 mr-2" />
                  הוסף איש קשר
                </Button>
              </div>
            </div>

            <Separator />

            {/* Contacts List */}
            <div className="grid gap-4">
              {contactsLoading ? (
                <p className="text-center text-muted-foreground">טוען אנשי קשר...</p>
              ) : contacts.length === 0 ? (
                <Card className="p-8 text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">עדיין לא הוספת אנשי קשר</p>
                  <Button onClick={handleAddContact} className="mt-4">
                    הוסף את איש הקשר הראשון
                  </Button>
                </Card>
              ) : (
                contacts.map((contact) => (
                  <Card key={contact.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{contact.full_name}</h4>
                            <Badge variant="outline">
                              {relationLabels[contact.relation]}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-4 h-4" />
                            {contact.phone}
                          </div>
                          {contact.is_emergency_candidate && (
                            <Badge className={getEmergencyStatusColor(contact.emergency_status)}>
                              {getEmergencyStatusIcon(contact.emergency_status)}
                              <span className="mr-1">
                                {getEmergencyStatusText(contact.emergency_status)}
                              </span>
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {contact.emergency_status === 'NONE' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSendEmergencyRequest(contact.id)}
                            >
                              <Send className="w-4 h-4 mr-1" />
                              שלח בקשת חירום
                            </Button>
                          )}
                          {contact.emergency_status === 'PENDING' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRevokeEmergencyStatus(contact.id)}
                            >
                              <X className="w-4 h-4 mr-1" />
                              בטל בקשה
                            </Button>
                          )}
                          {contact.emergency_status === 'APPROVED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRevokeEmergencyStatus(contact.id)}
                            >
                              <ShieldX className="w-4 h-4 mr-1" />
                              בטל אישור
                            </Button>
                          )}
                          {contact.emergency_status === 'DECLINED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSendEmergencyRequest(contact.id)}
                            >
                              <Send className="w-4 h-4 mr-1" />
                              שלח שוב
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditContact(contact)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>מחיקת איש קשר</AlertDialogTitle>
                                <AlertDialogDescription>
                                  האם אתה בטוח שברצונך למחוק את {contact.full_name}? פעולה זו לא ניתנת לביטול.
                                </AlertDialogDescription>     
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>ביטול</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteContact(contact.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  מחק
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Add/Edit Contact Dialog */}
        <Dialog open={isAddingContact} onOpenChange={setIsAddingContact}>
          <DialogContent className="rtl-text">
            <DialogHeader>
              <DialogTitle>
                {editingContact ? 'עריכת איש קשר' : 'הוספת איש קשר'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">שם מלא *</Label>
                <Input
                  id="contactName"
                  value={contactForm.full_name}
                  onChange={(e) => setContactForm(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="הכנס שם מלא"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="relation">קרבה *</Label>
                <Select 
                  value={contactForm.relation} 
                  onValueChange={(value: Contact['relation']) => 
                    setContactForm(prev => ({ ...prev, relation: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(relationLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">טלפון נייד *</Label>
                  <Input
                    id="phone"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="05X-XXXXXXX"
                    dir="ltr"
                  />
                </div>
                
                {!editingContact && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="sendEmergencyRequest"
                      checked={contactForm.sendEmergencyRequest}
                      onChange={(e) => setContactForm(prev => ({ ...prev, sendEmergencyRequest: e.target.checked }))}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="sendEmergencyRequest" className="text-sm">
                      שלח בקשה כאיש קשר חירום מיד לאחר השמירה
                    </Label>
                  </div>
                )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddingContact(false)}>
                  <X className="w-4 h-4 mr-2" />
                  ביטול
                </Button>
                <Button 
                  onClick={handleSaveContact}
                  disabled={!contactForm.full_name.trim() || !contactForm.phone.trim()}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingContact ? 'עדכן' : 'הוסף'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};

export default NewSettingsModal;