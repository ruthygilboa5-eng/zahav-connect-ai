import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UploadProgress {
  progress: number;
  isUploading: boolean;
}

export const useSupabaseStorage = () => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({ progress: 0, isUploading: false });
  const { toast } = useToast();

  const uploadFile = async (
    file: File, 
    bucketName: string, 
    filePath: string,
    onProgress?: (progress: number) => void
  ): Promise<{ data?: any; error?: any }> => {
    try {
      setUploadProgress({ progress: 0, isUploading: true });

      // Check if bucket exists
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      if (bucketsError) throw bucketsError;
      
      const bucketExists = buckets?.some(bucket => bucket.id === bucketName);
      if (!bucketExists) {
        throw new Error(`Bucket '${bucketName}' not found. Please create it in Supabase Dashboard.`);
      }

      // Upload file
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          upsert: true
        });

      if (error) throw error;

      // Simulate progress for UI feedback
      const simulateProgress = () => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          setUploadProgress({ progress, isUploading: true });
          onProgress?.(progress);
          if (progress >= 100) {
            clearInterval(interval);
            setUploadProgress({ progress: 100, isUploading: false });
          }
        }, 100);
      };

      simulateProgress();
      return { data };
    } catch (error: any) {
      setUploadProgress({ progress: 0, isUploading: false });
      
      if (error.message.includes('Bucket') && error.message.includes('not found')) {
        toast({
          title: 'אחסון לא זמין',
          description: `נא ליצור bucket בשם '${bucketName}' ב-Supabase Dashboard`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'שגיאת העלאה',
          description: error.message,
          variant: 'destructive',
        });
      }
      
      return { error };
    }
  };

  const deleteFile = async (bucketName: string, filePath: string) => {
    try {
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);
      
      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      toast({
        title: 'שגיאת מחיקה',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
  };

  const getPublicUrl = (bucketName: string, filePath: string) => {
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  };

  return {
    uploadFile,
    deleteFile,
    getPublicUrl,
    uploadProgress
  };
};