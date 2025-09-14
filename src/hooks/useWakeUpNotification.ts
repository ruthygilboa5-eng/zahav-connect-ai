import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface FamilyMember {
  id: string;
  email: string;
  full_name: string;
  relationship_label: string;
  gender: 'male' | 'female';
}

interface MessageTemplate {
  subject: string;
  body: string;
}

export const useWakeUpNotification = () => {
  const [loading, setLoading] = useState(false);
  const { authState } = useAuth();
  const { toast } = useToast();

  const sendWakeUpNotification = async () => {
    if (!authState.user) {
      toast({
        title: 'שגיאה',
        description: 'משתמש לא מחובר',
        variant: 'destructive',
      });
      return false;
    }

    setLoading(true);

    try {
      console.log('Starting wake up notification process...');

      // 1. שלוף את כל בני המשפחה הקשורים למשתמש הראשי
      const { data: familyMembers, error: familyError } = await supabase
        .from('family_members')
        .select('id, email, full_name, relationship_label, gender')
        .eq('main_user_id', authState.user.id)
        .eq('status', 'ACTIVE');

      if (familyError) {
        console.error('Error fetching family members:', familyError);
        throw familyError;
      }

      if (!familyMembers || familyMembers.length === 0) {
        toast({
          title: 'אין בני משפחה',
          description: 'לא נמצאו בני משפחה לשליחת הודעה',
          variant: 'destructive',
        });
        return false;
      }

      console.log(`Found ${familyMembers.length} family members`);

      // 2. עבור כל בן משפחה - שלח הודעה
      const notifications = [];

      for (const member of familyMembers as FamilyMember[]) {
        try {
          // שלוף את הנוסח המתאים מטבלת message_templates
          const { data: template, error: templateError } = await supabase
            .from('message_templates')
            .select('subject, body')
            .eq('feature', 'wakeup')
            .eq('gender', member.gender)
            .single();

          if (templateError) {
            console.error(`Error fetching template for ${member.full_name}:`, templateError);
            // נסה לקחת את הנוסח הנייטרלי כפתרון חלופי
            const { data: neutralTemplate } = await supabase
              .from('message_templates')
              .select('subject, body')
              .eq('feature', 'wakeup')
              .eq('gender', 'neutral')
              .single();
            
            if (neutralTemplate) {
              notifications.push({
                member,
                template: neutralTemplate
              });
            }
            continue;
          }

          if (template) {
            notifications.push({
              member,
              template: template as MessageTemplate
            });
          }
        } catch (error) {
          console.error(`Error processing member ${member.full_name}:`, error);
        }
      }

      if (notifications.length === 0) {
        toast({
          title: 'שגיאה',
          description: 'לא ניתן להכין הודעות לבני המשפחה',
          variant: 'destructive',
        });
        return false;
      }

      // 3. שלח את כל ההודעות
      const promises = notifications.map(async ({ member, template }) => {
        // החלף את המשתנה [relationship_label] בערך האמיתי
        const personalizedBody = template.body.replace('[relationship_label]', member.relationship_label);
        const personalizedSubject = template.subject;

        // צור התראה באפליקציה
        const { error: queueError } = await supabase
          .from('pending_queue')
          .insert({
            owner_user_id: authState.user!.id,
            user_id: authState.user!.id,
            item_type: 'wakeup_notification',
            item_data: {
              recipient: member.full_name,
              message: personalizedBody,
              relationship: member.relationship_label
            },
            status: 'APPROVED'
          });

        if (queueError) {
          console.error('Error creating in-app notification:', queueError);
        }

        // שלח מייל
        try {
          const { error: emailError } = await supabase.functions.invoke('send-notification', {
            body: {
              type: 'wakeup',
              message: personalizedBody,
              recipients: [member.email],
              metadata: {
                subject: personalizedSubject,
                relationship: member.relationship_label,
                recipient_name: member.full_name
              }
            }
          });

          if (emailError) {
            console.error('Error sending email:', emailError);
          }

          return { success: true, member: member.full_name };
        } catch (emailError) {
          console.error('Email sending failed:', emailError);
          return { success: false, member: member.full_name, error: emailError };
        }
      });

      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      console.log(`Wake up notifications sent: ${successCount} success, ${failureCount} failed`);

      if (successCount > 0) {
        toast({
          title: 'הודעת התעוررת נשלחה בהצלחה ✔️',
          description: `נשלחה ל-${successCount} בני משפחה`,
        });
        return true;
      } else {
        toast({
          title: 'שגיאה בשליחת הודעות',
          description: 'לא ניתן לשלוח אף הודעה',
          variant: 'destructive',
        });
        return false;
      }

    } catch (error: any) {
      console.error('Wake up notification error:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בשליחת הודעת ההתעוררות',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    sendWakeUpNotification,
    loading
  };
};