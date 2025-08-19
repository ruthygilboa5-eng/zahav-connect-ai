import { DEV_MODE_DEMO } from '@/config/dev';

export default function DevModeBanner() {
  return (
    <div className={`w-full text-center py-2 text-sm font-medium ${
      DEV_MODE_DEMO 
        ? 'bg-yellow-100 text-yellow-800' 
        : 'bg-green-100 text-green-800'
    }`}>
      {DEV_MODE_DEMO 
        ? '🟡 Demo Mode – no Auth, local state only'
        : '🟢 Real Mode – Supabase Auth active'
      }
    </div>
  );
}