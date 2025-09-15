import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  Eye, 
  Heart, 
  MessageSquare, 
  Calendar, 
  Gamepad2, 
  AlertTriangle, 
  Phone,
  Bell,
  Camera,
  Shield
} from 'lucide-react';
import PermissionRequestsSection from './PermissionRequestsSection';

interface FamilyMemberWithPermissions {
  id: string;
  full_name: string;
  relationship_label: string;
  email: string;
  status: string;
  phone?: string;
  gender: string;
  created_at: string;
  pending_requests_count: number;
  approved_permissions_count: number;
}

const MainUserDashboard = () => {
  const { authState } = useAuth();
  const { familyMembers, loading } = useFamilyMembers();
  const [membersWithPermissions, setMembersWithPermissions] = useState<FamilyMemberWithPermissions[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (familyMembers.length > 0) {
      loadPermissionsData();
    }
  }, [familyMembers]);

  const loadPermissionsData = async () => {
    setPermissionsLoading(true);
    try {
      const membersWithPerms = await Promise.all(
        familyMembers.map(async (member) => {
          // Get family_link id by matching owner (current main user) and member email
          const { data: familyLinkData, error: linkErr } = await supabase
            .from('family_links')
            .select('id')
            .eq('owner_user_id', authState.user?.id as string)
            .eq('email', member.email)
            .maybeSingle();

          let pendingCount = 0;
          let approvedCount = 0;

          if (familyLinkData) {
            const { data: permissionsData } = await supabase
              .from('family_members_permissions')
              .select('status')
              .eq('family_member_id', familyLinkData.id);

            pendingCount = permissionsData?.filter(p => p.status === 'pending').length || 0;
            approvedCount = permissionsData?.filter(p => p.status === 'approved').length || 0;
          }

          return {
            ...member,
            pending_requests_count: pendingCount,
            approved_permissions_count: approvedCount
          };
        })
      );

      setMembersWithPermissions(membersWithPerms);
    } catch (error) {
      console.error('Error loading permissions data:', error);
    } finally {
      setPermissionsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">פעיל</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">ממתין</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800">נדחה</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-pulse">טוען נתוני בני המשפחה...</div>
        </div>
      </div>
    );
  }

  const buttons = [
    {
      id: 'wakeup',
      name: 'התעוררתי',
      description: 'אני בסדר',
      icon: Heart,
      className: 'zahav-button zahav-button-green',
      action: 'wakeup',
      position: 'center'
    },
    {
      id: 'emergency',
      name: 'חירום',
      description: 'עזרה מיידית',
      icon: AlertTriangle,
      className: 'zahav-button zahav-button-red',
      action: 'emergency',
      position: 'petal'
    },
    {
      id: 'contacts',
      name: 'מוקדים',
      description: 'משטרה ומד״א',
      icon: Phone,
      className: 'zahav-button zahav-button-purple',
      action: 'emergency-contacts',
      position: 'petal'
    },
    {
      id: 'reminders',
      name: 'תזכורות',
      description: 'תרופות ופגישות',
      icon: Bell,
      className: 'zahav-button zahav-button-blue',
      action: 'reminders',
      position: 'petal'
    },
    {
      id: 'memories',
      name: 'זכרונות',
      description: 'תמונות וסיפורים',
      icon: Camera,
      className: 'zahav-button zahav-button-yellow',
      action: 'memories',
      position: 'petal'
    },
    {
      id: 'games',
      name: 'משחקים',
      description: 'עם הנכדים',
      icon: Gamepad2,
      className: 'zahav-button zahav-button-pink',
      action: 'games',
      position: 'petal'
    },
    {
      id: 'family',
      name: 'המשפחה',
      description: 'הודעות ועדכונים',
      icon: MessageSquare,
      className: 'zahav-button zahav-button-orange',
      action: 'family-board',
      position: 'petal'
    }
  ];

  const centerButton = buttons.find(b => b.position === 'center');
  const petalButtons = buttons.filter(b => b.position === 'petal');

  const handleButtonClick = (action: string, buttonName: string) => {
    console.log(`Action: ${action}`);
    
    // Navigate to specific pages
    switch (action) {
      case 'wakeup':
        navigate('/wakeup');
        break;
      case 'emergency':
        navigate('/emergency');
        break;
      case 'emergency-contacts':
        navigate('/emergency-contacts');
        break;
      case 'reminders':
        navigate('/reminders');
        break;
      case 'memories':
        navigate('/memories');
        break;
      case 'games':
        navigate('/games');
        break;
      case 'family-board':
        navigate('/family-board');
        break;
      case 'permission-requests':
        navigate('/permission-requests');
        break;
      default:
        console.log(`No navigation defined for action: ${action}`);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          שלום, משתמש ראשי!
        </h1>
        <p className="text-xl text-muted-foreground">
          מה תרצה לעשות היום?
        </p>
      </div>

      {/* Flower Arrangement */}
      <div className="flower-arrangement mb-8">
        {/* Center Button */}
        {centerButton && (
          <div className="flower-center">
            <button
              onClick={() => handleButtonClick(centerButton.action, centerButton.name)}
              className={`${centerButton.className} w-28 h-28 md:w-36 md:h-36`}
              aria-label={centerButton.description}
            >
              <centerButton.icon className="w-8 h-8 md:w-10 md:h-10 mb-1" />
              <span className="text-sm md:text-base font-bold">
                {centerButton.name}
              </span>
            </button>
          </div>
        )}

        {/* Surrounding Buttons */}
        {petalButtons.map((button, index) => (
          <div key={button.id} className="flower-petal">
            <button
              onClick={() => handleButtonClick(button.action, button.name)}
              className={button.className}
              aria-label={button.description}
            >
              <button.icon className="w-6 h-6 md:w-7 md:h-7 mb-1" />
              <span className="text-xs md:text-sm font-bold leading-tight">
                {button.name}
              </span>
            </button>
          </div>
        ))}
      </div>

      {/* Family Permission Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            ניהול הרשאות בני המשפחה
          </CardTitle>
          <CardDescription>
            בקשות הרשאות ממתינות לאישור מבני המשפחה
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PermissionRequestsSection />
        </CardContent>
      </Card>
    </div>
  );
};

export default MainUserDashboard;