import { useNavigate } from 'react-router-dom';
import FamilyAuthChoice from './FamilyAuthChoice';
import FamilyMemberSignup from './FamilyMemberSignup';

// Wrapper for FamilyAuthChoice with proper navigation
export const FamilyAuthChoiceWrapper = () => {
  const navigate = useNavigate();
  
  return (
    <FamilyAuthChoice 
      onBack={() => navigate('/')} 
    />
  );
};

// Wrapper for FamilyMemberSignup with proper navigation
export const FamilyMemberSignupWrapper = () => {
  const navigate = useNavigate();
  
  return (
    <FamilyMemberSignup 
      onComplete={() => {
        // After successful registration, navigate to home
        navigate('/', { replace: true });
      }}
      onBack={() => navigate('/family-auth')}
    />
  );
};