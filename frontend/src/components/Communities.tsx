'use client';

import { TrendingUp, Clock, Zap, Target, Users, MessageSquare, BarChart3 } from 'lucide-react';

interface Community {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  memberCount: number;
}

interface CommunitiesProps {
  selectedCommunity: string;
  onSelectCommunity: (communityId: string) => void;
}

const communities: Community[] = [
  {
    id: 'all',
    name: 'All Posts',
    description: 'View all trading discussions',
    icon: MessageSquare,
    color: 'from-blue-600 to-blue-700',
    memberCount: 1250
  },
  {
    id: 'longterm',
    name: 'Long Term',
    description: 'Value investing & 1+ year holds',
    icon: Target,
    color: 'from-green-600 to-green-700',
    memberCount: 856
  },
  {
    id: 'shortterm',
    name: 'Short Term',
    description: 'Swing trading & momentum plays',
    icon: TrendingUp,
    color: 'from-orange-600 to-orange-700',
    memberCount: 623
  },
  {
    id: 'daytrading',
    name: 'Day Trading',
    description: 'Intraday scalping strategies',
    icon: Zap,
    color: 'from-red-600 to-red-700',
    memberCount: 445
  },
  {
    id: 'technical',
    name: 'Technical Analysis',
    description: 'Charts, patterns & indicators',
    icon: BarChart3,
    color: 'from-purple-600 to-purple-700',
    memberCount: 734
  },
  {
    id: 'fundamental',
    name: 'Fundamentals',
    description: 'Earnings, balance sheets & research',
    icon: Users,
    color: 'from-indigo-600 to-indigo-700',
    memberCount: 512
  }
];

export default function Communities({ selectedCommunity, onSelectCommunity }: CommunitiesProps) {
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-bold text-white mb-3 px-2">Communities</h2>
      
      {communities.map((community) => {
        const Icon = community.icon;
        const isSelected = selectedCommunity === community.id;
        
        return (
          <button
            key={community.id}
            onClick={() => onSelectCommunity(community.id)}
            className={`w-full text-left rounded-lg p-3 transition-all duration-200 ${
              isSelected
                ? `bg-gradient-to-r ${community.color} shadow-lg`
                : 'bg-gray-800 hover:bg-gray-750'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                isSelected ? 'bg-white bg-opacity-20' : 'bg-gray-700'
              }`}>
                <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold text-sm ${
                  isSelected ? 'text-white' : 'text-gray-200'
                }`}>
                  {community.name}
                </h3>
                <p className={`text-xs line-clamp-1 ${
                  isSelected ? 'text-white text-opacity-80' : 'text-gray-400'
                }`}>
                  {community.description}
                </p>
              </div>
              
              <div className={`text-xs ${
                isSelected ? 'text-white text-opacity-70' : 'text-gray-500'
              }`}>
                {community.memberCount}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
