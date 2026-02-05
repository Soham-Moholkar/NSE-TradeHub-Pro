'use client';

import React, { useState, useEffect } from 'react';
import { 
  Menu, X, TrendingUp, Briefcase, Brain, Activity, 
  BarChart2, PieChart, Bell, Settings, LogOut, User,
  ChevronRight, MessageSquare, ShoppingCart
} from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isLoggedIn: boolean;
  username?: string;
  onLogin: () => void;
  onLogout: () => void;
}

const tabs = [
  { id: 'overview', label: 'Overview', icon: TrendingUp },
  { id: 'charts', label: 'Charts', icon: BarChart2 },
  { id: 'ml', label: 'AI Predictions', icon: Brain },
  { id: 'technical', label: 'Technical', icon: Activity },
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
  { id: 'trading', label: 'Trading', icon: ShoppingCart },
  { id: 'heatmap', label: 'Heatmap', icon: PieChart },
  { id: 'community', label: 'Community', icon: MessageSquare },
];

export default function MobileNav({ 
  activeTab, 
  onTabChange, 
  isLoggedIn, 
  username,
  onLogin,
  onLogout 
}: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Close menu when clicking outside or on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Header Bar - only visible on mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#0d0d0d] border-b border-[#262626]">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white">NSE Pro</span>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center gap-2">
            {/* Hamburger Menu */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <X className="w-6 h-6 text-gray-400" />
              ) : (
                <Menu className="w-6 h-6 text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/70 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out Menu */}
      <div className={`
        md:hidden fixed top-0 right-0 h-full w-72 z-50 
        bg-[#0d0d0d] border-l border-[#262626]
        transform transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Menu Header */}
          <div className="p-4 border-b border-[#262626]">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Menu</span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-[#1a1a1a] transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* User Section */}
          <div className="p-4 border-b border-[#262626]">
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-white">{username}</p>
                  <p className="text-xs text-gray-500">Paper Trading Account</p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  onLogin();
                  setIsOpen(false);
                }}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
              >
                Sign In to Trade
              </button>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex-1 py-2 overflow-y-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`
                    w-full flex items-center justify-between px-4 py-3
                    transition-colors duration-200
                    ${isActive 
                      ? 'bg-blue-600/20 text-blue-400' 
                      : 'text-gray-400 hover:bg-[#1a1a1a]'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : ''}`} />
                    <span className="font-medium">{tab.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4" />}
                </button>
              );
            })}
          </div>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-[#262626] space-y-2">
            {/* Alerts */}
            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-[#1a1a1a] transition-colors text-gray-400">
              <Bell className="w-5 h-5" />
              <span>Price Alerts</span>
              <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">3</span>
            </button>

            {/* Settings */}
            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-[#1a1a1a] transition-colors text-gray-400">
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </button>

            {/* Logout */}
            {isLoggedIn && (
              <button 
                onClick={() => {
                  onLogout();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-red-500/10 transition-colors text-red-400"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Tab Bar - Mobile Only */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d0d0d] border-t border-[#262626] safe-area-bottom">
        <div className="flex justify-around items-center py-2">
          {tabs.slice(0, 6).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors
                  ${isActive 
                    ? 'text-blue-400' 
                    : 'text-gray-500'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : ''}`} />
                <span className="text-xs font-medium">{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
