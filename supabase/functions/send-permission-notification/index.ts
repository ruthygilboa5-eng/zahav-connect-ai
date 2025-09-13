import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PermissionNotificationRequest {
  family_member_id: string;
  feature: string;
  status: 'approved' | 'rejected';
  family_member_name: string;
  family_member_email: string;
}

const featureLabels: Record<string, string> = {
  wakeup: 'שירות השכמה',
  memories: 'זיכרונות ותמונות',
  games: 'משחקים',
  reminders: 'תזכורות',
  emergency: 'שירותי חירום',
  contacts: 'אנשי קשר',
  family_board: 'לוח המשפחה'
};

const getEmailContent = (feature: string, status: 'approved' | 'rejected', familyMemberName: string) => {
  const featureName = featureLabels[feature] || feature;
  
  if (status === 'approved') {
    return {
      subject: `בקשתך אושרה - ${featureName} 🎉`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h1 style="margin: 0; font-size: 28px;">🎉 בקשתך אושרה!</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">שלום ${familyMemberName}</p>
          </div>
          
          <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin-bottom: 25px; border-right: 4px solid #10B981;">
            <h2 style="color: #1f2937; margin-top: 0;">בקשתך להשתמש ב-${featureName} אושרה</h2>
            <p style="color: #4b5563; line-height: 1.6;">
              כעת תוכל להשתמש בכל הפונקציות הקשורות ל-${featureName}. 
              התחבר לאפליקציה כדי להתחיל להשתמש בשירות.
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; background: #f1f5f9; border-radius: 8px;">
            <p style="color: #64748b; margin: 0; font-size: 14px;">
              מערכת זהב - טכנולוגיה לשמירה על הקשר המשפחתי
            </p>
          </div>
        </div>
      `
    };
  } else {
    return {
      subject: `בקשתך נדחתה - ${featureName}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #DC2626, #B91C1C); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h1 style="margin: 0; font-size: 28px;">בקשתך נדחתה</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">שלום ${familyMemberName}</p>
          </div>
          
          <div style="background: #fef2f2; padding: 25px; border-radius: 12px; margin-bottom: 25px; border-right: 4px solid #DC2626;">
            <h2 style="color: #1f2937; margin-top: 0;">בקשתך להשתמש ב-${featureName} נדחתה</h2>
            <p style="color: #4b5563; line-height: 1.6;">
              המשתמש הראשי החליט לא לאשר את הבקשה כרגע. 
              ניתן להגיש בקשה חדשה בכל עת דרך האפליקציה.
            </p>
          </div>
          
          <div style="background: #e0f2fe; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <p style="color: #0277bd; margin: 0; font-size: 16px; text-align: center;">
              💡 ניתן לפנות למשתמש הראשי ישירות לקבלת הסבר נוסף
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; background: #f1f5f9; border-radius: 8px;">
            <p style="color: #64748b; margin: 0; font-size: 14px;">
              מערכת זהב - טכנולוגיה לשמירה על הקשר המשפחתי
            </p>
          </div>
        </div>
      `
    };
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const requestData: PermissionNotificationRequest = await req.json();
    console.log('Permission notification request:', requestData);

    const { 
      family_member_id, 
      feature, 
      status, 
      family_member_name, 
      family_member_email 
    } = requestData;

    // Validate required fields
    if (!family_member_id || !feature || !status || !family_member_name || !family_member_email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get email content
    const emailContent = getEmailContent(feature, status, family_member_name);

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: 'מערכת זהב <notifications@resend.dev>',
      to: [family_member_email],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Permission notification sent successfully',
        email_id: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in send-permission-notification function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);