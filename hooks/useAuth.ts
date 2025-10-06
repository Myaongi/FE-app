import { useContext } from 'react';
import { AuthContext } from '../App';
import { AuthContextType } from '../types';

export const useAuth = (): AuthContextType & { userMemberId: number | null } => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return {
    ...context,
    userMemberId: context.userProfile?.memberId || null,
  };
};
