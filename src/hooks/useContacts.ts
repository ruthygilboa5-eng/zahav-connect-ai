import { useState, useEffect } from 'react';
import { Contact } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { contactsProvider } from '@/providers';

export const useContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchContacts = async () => {
    try {
      const data = await contactsProvider.getContacts();
      setContacts(data);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את אנשי הקשר",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addContact = async (contactData: Omit<Contact, 'id' | 'owner_user_id' | 'created_at' | 'updated_at'>) => {
    try {
      // Check for duplicates in current contacts
      const existingContact = contacts.find(c => c.phone === contactData.phone);
      if (existingContact) {
        toast({
          title: "שגיאה",
          description: `מספר הטלפון כבר קיים עבור ${existingContact.full_name}`,
          variant: "destructive",
        });
        return false;
      }

      const newContact = await contactsProvider.addContact(contactData);
      setContacts(prev => [newContact, ...prev]);
      
      toast({
        title: "הצלחה",
        description: "איש הקשר נוסף בהצלחה",
      });
      return true;
    } catch (error) {
      console.error('Error adding contact:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן להוסיף את איש הקשר",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    try {
      const updatedContact = await contactsProvider.updateContact(id, updates);
      setContacts(prev => prev.map(contact => 
        contact.id === id ? updatedContact : contact
      ));

      toast({
        title: "הצלחה",
        description: "איש הקשר עודכן בהצלחה",
      });
      return true;
    } catch (error) {
      console.error('Error updating contact:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לעדכן את איש הקשר",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteContact = async (id: string) => {
    try {
      await contactsProvider.deleteContact(id);
      setContacts(prev => prev.filter(contact => contact.id !== id));
      
      toast({
        title: "הצלחה",
        description: "איש הקשר נמחק בהצלחה",
      });
      return true;
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן למחוק את איש הקשר",
        variant: "destructive",
      });
      return false;
    }
  };

  const sendEmergencyRequest = async (contactId: string) => {
    try {
      await contactsProvider.sendEmergencyRequest(contactId);
      
      // Update local state
      setContacts(prev => prev.map(contact => 
        contact.id === contactId 
          ? { ...contact, is_emergency_candidate: true, emergency_status: 'PENDING' }
          : contact
      ));

      toast({
        title: "הצלחה",
        description: "בקשת חירום נשלחה בהצלחה",
      });
      return true;
    } catch (error) {
      console.error('Error sending emergency request:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לשלוח בקשת חירום",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  return {
    contacts,
    loading,
    addContact,
    updateContact,
    deleteContact,
    sendEmergencyRequest,
    refetch: fetchContacts
  };
};