import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Gamepad2, Users, User, Home, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGoHome } from '@/hooks/useGoHome';
import { useFamilyLinks } from '@/hooks/useFamilyLinks';
import { createGameMessage } from '@/utils/genderMessages';
import { useNotifications } from '@/hooks/useNotifications';

const GamesPage = () => {
  const navigate = useNavigate();
  const goHome = useGoHome();
  const { familyLinks } = useFamilyLinks();
  const { sendGameNotification } = useNotifications();

  // Create family games based on actual family members
  const getFamilyGames = () => {
    const approvedFamily = familyLinks.filter(link => link.status === 'APPROVED');
    
    if (approvedFamily.length === 0) {
      return [
        {
          id: 'no-family',
          name: 'אין משחקים זמינים',
          description: 'הוסף בני משפחה כדי לשחק משחקים משותפים',
          icon: '🎲',
          players: 'אין שחקנים',
          status: 'לא זמין',
          action: 'הוסף משפחה'
        }
      ];
    }
    
    const games = [
      { name: 'שש-בש', icon: '🎲', description: 'משחק שש-בש אונליין' },
      { name: 'דמקה', icon: '⚫', description: 'משחק דמקה משפחתי' },
      { name: 'קלפים', icon: '🃏', description: 'משחקי קלפים מגוונים' }
    ];
    
    return approvedFamily.slice(0, 3).map((member, index) => ({
      id: `game-${member.id}`,
      name: `${games[index]?.name || 'משחק'} עם ${member.full_name}`,
      description: games[index]?.description || 'משחק משפחתי',
      icon: games[index]?.icon || '🎮',
      players: `עם ${member.full_name}`,
      status: Math.random() > 0.5 ? 'מחובר' : 'מחכה',
      action: Math.random() > 0.5 ? 'שחק עכשיו' : 'הזמן למשחק',
      familyMember: member
    }));
  };

  const familyGames = getFamilyGames();

  const soloGames = [
    {
      id: 'sudoku',
      name: 'סודוקו',
      description: 'משחק חשיבה יומי',
      icon: '🔢',
      difficulty: 'קל',
      action: 'שחק'
    },
    {
      id: 'crossword',
      name: 'תשבץ',
      description: 'תשבץ עברי יומי',
      icon: '📝',
      difficulty: 'בינוני',
      action: 'שחק'
    },
    {
      id: 'memory',
      name: 'משחק זיכרון',
      description: 'חידון זכרונות אישיים',
      icon: '🧠',
      difficulty: 'קל',
      action: 'שחק'
    }
  ];

  const handleGameClick = async (gameId: string, gameName: string, familyMember?: any) => {
    console.log(`Starting game: ${gameId} - ${gameName}`);
    
    // If it's a family game invitation, send notification
    if (familyMember && gameId !== 'no-family') {
      const userInfo = {
        gender: familyMember.gender,
        relationship_label: familyMember.relationship_to_primary_user || 'בן/בת משפחה',
        full_name: familyMember.full_name
      };
      
      const message = createGameMessage(userInfo);
      await sendGameNotification(message, [familyMember.email].filter(Boolean), { gameId, gameName });
      
      console.log('Game invitation sent:', message);
    }
    
    // Here we would integrate with actual game platforms
  };

  return (
    <div className="p-4 rtl-text min-h-screen">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <Gamepad2 className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-foreground mb-2">
            משחקים
          </h1>
          <p className="text-xl text-muted-foreground">
            משחקים עם המשפחה ולבד
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">משחקים משותפים</h2>
          </div>
          
          <div className="space-y-4">
            {familyGames.map((game) => (
              <Card key={game.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{game.icon}</div>
                    <div className="text-right">
                      <h3 className="text-lg font-bold text-foreground">
                        {game.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {game.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-primary font-medium">
                          {game.players}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          game.status === 'מחובר' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {game.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleGameClick(game.id, game.name, (game as any).familyMember)}
                    className="bg-primary text-primary-foreground"
                    disabled={game.id === 'no-family'}
                  >
                    <ExternalLink className="w-4 h-4 ml-2" />
                    {game.action}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">משחקי חשיבה</h2>
          </div>
          
          <div className="space-y-4">
            {soloGames.map((game) => (
              <Card key={game.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{game.icon}</div>
                    <div className="text-right">
                      <h3 className="text-lg font-bold text-foreground">
                        {game.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {game.description}
                      </p>
                      <span className="text-xs text-primary font-medium">
                        רמת קושי: {game.difficulty}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleGameClick(game.id, game.name)}
                    variant="outline"
                  >
                    {game.action}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <Button
          onClick={goHome}
          variant="outline"
          className="w-full"
        >
          <Home className="w-5 h-5 ml-2" />
          חזרה לעמוד הראשי
        </Button>
      </div>
    </div>
  );
};

export default GamesPage;