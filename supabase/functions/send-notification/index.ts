import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: 'wake_up' | 'emergency' | 'reminder' | 'memory' | 'game' | 'family_board';
  message: string;
  recipients: string[];
  metadata?: Record<string, any>;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, message, recipients, metadata = {} }: NotificationRequest = await req.json();

    console.log('Processing notification:', { type, message, recipients: recipients.length, metadata });

    if (!recipients || recipients.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No recipients specified' }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

      // Get appropriate email template based on notification type
      const emailSubject = metadata.subject || getEmailSubject(type);
      const emailHtml = getEmailTemplate(type, message, metadata);

    // Send emails to all recipients
    const emailPromises = recipients.map(async (recipient) => {
      try {
        const emailResponse = await resend.emails.send({
          from: "זהב - מערכת התראות <notifications@resend.dev>",
          to: [recipient],
          subject: emailSubject,
          html: emailHtml,
        });

        console.log(`Email sent to ${recipient}:`, emailResponse);
        return { success: true, recipient, id: emailResponse.data?.id };
      } catch (error) {
        console.error(`Failed to send email to ${recipient}:`, error);
        return { success: false, recipient, error: error.message };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`Notification summary: ${successCount} sent, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        summary: {
          total: recipients.length,
          sent: successCount,
          failed: failureCount
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function getEmailSubject(type: string): string {
  switch (type) {
    case 'wake_up':
      return '🌅 הודעת התעוררות - זהב';
    case 'emergency':
      return '🚨 הודעת חירום - זהב';
    case 'reminder':
      return '⏰ תזכורת - זהב';
    case 'memory':
      return '📖 זיכרון חדש - זהב';
    case 'game':
      return '🎲 הזמנה למשחק - זהב';
    case 'family_board':
      return '💬 הודעה משפחתית - זהב';
    default:
      return '📬 הודעה חדשה - זהב';
  }
}

function getEmailTemplate(type: string, message: string, metadata: Record<string, any>): string {
  // Use the message from the template directly, or construct from metadata if available
  const subject = metadata.subject || getEmailSubject(type);
  const finalMessage = message || 'הודעה מהמערכת';
  
  const baseTemplate = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          direction: rtl;
          text-align: right;
          background-color: #f9fafb;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e5e7eb;
        }
        .logo {
          font-size: 32px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 10px;
        }
        .message {
          font-size: 18px;
          line-height: 1.6;
          color: #374151;
          margin: 20px 0;
          padding: 20px;
          background-color: #f3f4f6;
          border-radius: 8px;
          border-right: 4px solid #3b82f6;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
        }
        .emergency {
          border-right-color: #ef4444;
          background-color: #fef2f2;
        }
        .wake-up {
          border-right-color: #10b981;
          background-color: #f0fdf4;
        }
        .reminder {
          border-right-color: #f59e0b;
          background-color: #fffbeb;
        }
        .metadata {
          margin-top: 15px;
          padding: 10px;
          background-color: #f9fafb;
          border-radius: 6px;
          font-size: 14px;
          color: #6b7280;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🏠 זהב</div>
          <p>מערכת התראות משפחתית</p>
        </div>
        
        <div class="message ${getMessageClass(type)}">
          ${finalMessage}
          ${getMetadataHtml(type, metadata)}
        </div>
        
        <div class="footer">
          <p>הודעה זו נשלחה ממערכת זהב</p>
          <p>שעת שליחה: ${new Date().toLocaleString('he-IL')}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return baseTemplate;
}

function getMessageClass(type: string): string {
  switch (type) {
    case 'emergency':
      return 'emergency';
    case 'wake_up':
      return 'wake-up';
    case 'reminder':
      return 'reminder';
    default:
      return '';
  }
}

function getMetadataHtml(type: string, metadata: Record<string, any>): string {
  if (!metadata || Object.keys(metadata).length === 0) {
    return '';
  }

  let metadataHtml = '<div class="metadata">';
  
  if (type === 'emergency' && metadata.location) {
    metadataHtml += `<p><strong>מיקום:</strong> ${metadata.location}</p>`;
  }
  
  if (type === 'reminder' && metadata.reminder) {
    metadataHtml += `<p><strong>תזכורת:</strong> ${metadata.reminder.title || 'לא צוין'}</p>`;
  }
  
  if (type === 'memory' && metadata.categoryName) {
    metadataHtml += `<p><strong>קטגוריה:</strong> ${metadata.categoryName}</p>`;
  }
  
  if (type === 'game' && metadata.gameName) {
    metadataHtml += `<p><strong>משחק:</strong> ${metadata.gameName}</p>`;
  }
  
  metadataHtml += '</div>';
  
  return metadataHtml;
}

serve(handler);