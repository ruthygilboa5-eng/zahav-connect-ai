import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MessageTemplate {
  id: string;
  feature: string;
  gender: 'male' | 'female' | 'neutral';
  subject: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export const useMessageTemplates = () => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .order('feature', { ascending: true });

      if (error) {
        console.error('Error fetching message templates:', error);
        toast({
          title: 'שגיאה בטעינת תבניות הודעות',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      setTemplates((data || []) as MessageTemplate[]);
    } catch (error: any) {
      console.error('Error in fetchTemplates:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בטעינת תבניות ההודעות',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getTemplate = async (feature: string, gender: 'male' | 'female' | 'neutral') => {
    try {
      // Try to get specific gender template first
      let { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('feature', feature)
        .eq('gender', gender)
        .single();

      if (error && gender !== 'neutral') {
        // Fallback to neutral template if specific gender not found
        const { data: neutralData, error: neutralError } = await supabase
          .from('message_templates')
          .select('*')
          .eq('feature', feature)
          .eq('gender', 'neutral')
          .single();

        if (neutralError) {
          console.error('Error fetching template:', neutralError);
          return null;
        }

        data = neutralData as MessageTemplate;
      } else if (error) {
        console.error('Error fetching template:', error);
        return null;
      }

      return data as MessageTemplate;
    } catch (error: any) {
      console.error('Error in getTemplate:', error);
      return null;
    }
  };

  const createPersonalizedMessage = (template: MessageTemplate, relationshipLabel: string) => {
    return {
      subject: template.subject,
      body: template.body.replace(/\[relationship_label\]/g, relationshipLabel)
    };
  };

  // Fetch templates on mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  return {
    templates,
    loading,
    getTemplate,
    createPersonalizedMessage,
    refetch: fetchTemplates
  };
};