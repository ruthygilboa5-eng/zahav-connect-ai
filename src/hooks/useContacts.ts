import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Contact } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export const useContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchContacts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('owner_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching contacts:', error);
        toast({
          title: "שגיאה",
          description: "לא ניתן לטעון את אנשי הקשר",
          variant: "destructive",
        });
      } else {
        setContacts((data || []) as Contact[]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addContact = async (contactData: Omit<Contact, 'id' | 'owner_user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('contacts')
        .insert({
          ...contactData,
          owner_user_id: user.id
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "שגיאה",
            description: "מספר הטלפון כבר קיים במערכת",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return false;
      }

      setContacts(prev => [data as Contact, ...prev]);
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
      const { error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setContacts(prev => prev.map(contact => 
        contact.id === id ? { ...contact, ...updates } : contact
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
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;

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
      // Generate a unique token for the emergency consent
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

      const { error: consentError } = await supabase
        .from('emergency_consents')
        .insert({
          token,
          contact_id: contactId,
          expires_at: expiresAt.toISOString()
        });

      if (consentError) throw consentError;

      // Update contact status to pending
      await updateContact(contactId, { 
        is_emergency_candidate: true,
        emergency_status: 'PENDING' 
      });

      // TODO: Send SMS with approval link
      // This would typically integrate with an SMS service
      console.log(`Emergency request sent for contact ${contactId} with token ${token}`);

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