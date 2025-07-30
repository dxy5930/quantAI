import { UserLevel } from '../types';
import * as LucideIcons from 'lucide-react';

export interface BadgeConfig {
  icon: keyof typeof LucideIcons;
  text: string;
  variant: 'gold' | 'purple' | 'blue' | 'green' | 'red';
}

export const getUserBadgeConfig = (level: UserLevel): BadgeConfig | null => {
  switch (level) {
    case UserLevel.PREMIUM:
      return {
        icon: 'Star',
        text: 'VIP',
        variant: 'gold'
      };
    case UserLevel.SUPER:
      return {
        icon: 'Crown',
        text: 'SVIP',
        variant: 'purple'
      };
    default:
      return null;
  }
};