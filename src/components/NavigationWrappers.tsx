// Simple navigation wrapper for family auth routes
import { Navigate } from 'react-router-dom';

const FamilyAuthRoute = () => <Navigate to="/" />;
const FamilySignupComplete = () => <Navigate to="/" />;

export { FamilyAuthRoute, FamilySignupComplete };