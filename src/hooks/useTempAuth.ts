import { useState, useEffect } from 'react';

// Temporary auth solution until real authentication is implemented
export interface TempUser {
  id: string;
  email: string;
}

export const useTempAuth = () => {
  const [user, setUser] = useState<TempUser | null>(null);

  useEffect(() => {
    // Check if we have a temp user in localStorage
    const storedUser = localStorage.getItem('temp_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      // Create a temporary user
      const tempUser: TempUser = {
        id: crypto.randomUUID(),
        email: 'temp@zahav.com'
      };
      localStorage.setItem('temp_user', JSON.stringify(tempUser));
      setUser(tempUser);
    }
  }, []);

  return { user };
};