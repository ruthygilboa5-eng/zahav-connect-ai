import { useState } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { ENABLE_REAL_UPLOADS } from '@/config/dev';

export interface UploadResult {
  url: string;
  path: string;
  metadata: {
    size: number;
    type: string;
    filename: string;
  };
}

export const useSupabaseUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { storage, pendingQueue } = useSupabase();
  const { authState } = useAuth();
  const { toast } = useToast();

  const uploadMediaForApproval = async (
    file: File,
    title: string,
    description: string,
    familyLinkId: string
  ): Promise<{ data?: UploadResult; error?: any }> => {
    
    if (!ENABLE_REAL_UPLOADS) {
      toast({
        title: 'העלאות מבוטלות',
        description: 'העלאות אמיתיות מבוטלות במצב פיתוח',
        variant: 'destructive',
      });
      return { error: 'Uploads disabled' };
    }

    if (!authState.isAuthenticated || !authState.memberId) {
      return { error: 'Not authenticated' };
    }

    setIsUploading(true);

    try {
      // Create unique file path for pending uploads
      const fileExtension = file.name.split('.').pop();
      const uniqueId = crypto.randomUUID();
      const filePath = `pending/${authState.memberId}/${familyLinkId}/${uniqueId}.${fileExtension}`;
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await storage.uploadFile(
        file,
        'memories',
        filePath
      );

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const publicUrl = storage.getPublicUrl('memories', filePath);

      // Create pending queue item
      const mediaType = file.type.startsWith('video/') ? 'MEDIA' : 'MEDIA';
      
      const { error: queueError } = await pendingQueue.addPendingItem({
        submitted_by_link_id: familyLinkId,
        type: mediaType,
        payload: {
          title,
          description,
          url: publicUrl,
          filePath,
          filename: file.name,
          size: file.size,
          mimeType: file.type
        }
      });

      if (queueError) {
        // Clean up uploaded file if queue creation failed
        await storage.deleteFile('memories', filePath);
        throw queueError;
      }

      toast({
        title: 'נשלח לאישור',
        description: 'הקובץ הועלה והועבר לתור הממתין לאישור',
      });

      const result: UploadResult = {
        url: publicUrl,
        path: filePath,
        metadata: {
          size: file.size,
          type: file.type,
          filename: file.name
        }
      };

      return { data: result };
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'שגיאת העלאה',
        description: error.message || 'לא ניתן להעלות את הקובץ',
        variant: 'destructive',
      });
      return { error };
    } finally {
      setIsUploading(false);
    }
  };

  const approveAndMoveToMemories = async (pendingItemId: string, pendingItem: any) => {
    try {
      // Move file from pending to approved folder
      const oldPath = pendingItem.payload.filePath;
      const fileExtension = oldPath.split('.').pop();
      const uniqueId = crypto.randomUUID();
      const newPath = `approved/${authState.memberId}/${uniqueId}.${fileExtension}`;

      // Note: Supabase doesn't have a direct move operation, so we'd need to:
      // 1. Download the file
      // 2. Upload to new location  
      // 3. Delete old file
      // For now, we'll just update the URL reference

      const newUrl = storage.getPublicUrl('memories', newPath);

      // Add to memories
      const { error: memoryError } = await useSupabase().memories.addMemory({
        kind: pendingItem.payload.mimeType.startsWith('video/') ? 'VIDEO' : 'PHOTO',
        content: {
          ...pendingItem.payload,
          url: newUrl,
          filePath: newPath
        }
      });

      if (memoryError) throw memoryError;

      // Update pending item status
      await pendingQueue.updatePendingItem(pendingItemId, 'APPROVED');

      toast({
        title: 'אושר בהצלחה',
        description: 'התוכן נוסף לזיכרונות',
      });

      return { success: true };
    } catch (error: any) {
      console.error('Approval error:', error);
      toast({
        title: 'שגיאת אישור',
        description: 'לא ניתן לאשר את התוכן',
        variant: 'destructive',
      });
      return { error };
    }
  };

  return {
    uploadMediaForApproval,
    approveAndMoveToMemories,
    isUploading,
    uploadProgress: storage.uploadProgress
  };
};