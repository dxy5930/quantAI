import { UserLevel } from '../types';
import { Star, Crown } from 'lucide-react';

const iconMap = {
  Star,
  Crown,
};

export interface BadgeConfig {
  icon: keyof typeof iconMap;
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