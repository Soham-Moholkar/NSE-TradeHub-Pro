'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, Brain, Wallet, Users, BarChart3, Bot,
  CheckCircle, ArrowRight, Star, Shield, Zap,
  Activity, DollarSign, MessageSquare, Award
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const router = useRouter();

  const features = [
    {
      icon: Activity,
      title: 'Real NSE Data',
      description: 'Live streaming data directly from National Stock Exchange with real-time updates',
      color: 'text-quantx-blue',
      borderColor: 'border-quantx-blue/30',
      hoverGlow: 'hover:shadow-glow-blue'
    },
    {
      icon: Brain,
      title: 'Neural AI Predictions',
      description: 'Advanced neural networks analyzing 25+ technical indicators for accurate predictions',
      color: 'text-quantx-cyan',
      borderColor: 'border-quantx-cyan/30',
      hoverGlow: 'hover:shadow-glow-cyan'
    },
    {
      icon: Wallet,
      title: 'Paper Trading',
      description: 'Practice with ₹1,00,000 virtual money. No risk, real experience. Track your performance',
      color: 'text-quantx-green',
      borderColor: 'border-quantx-green/30',
      hoverGlow: 'hover:shadow-glow-green'
    },
    {
      icon: MessageSquare,
      title: 'Trading Community',
      description: 'Connect with traders, share ideas, and learn from the community. Reddit-style discussions',
      color: 'text-quantx-yellow',
      borderColor: 'border-quantx-yellow/30',
      hoverGlow: ''
    },
    {
      icon: BarChart3,
      title: 'Advanced Charts',
      description: '15+ chart types including Renko, Heikin-Ashi, Volume Profile, and more professional tools',
      color: 'text-quantx-blue',
      borderColor: 'border-quantx-blue/30',
      hoverGlow: 'hover:shadow-glow-blue'
    },
    {
      icon: Bot,
      title: 'AI Trading Assistant',
      description: 'Personal AI chatbot with Gemini that analyzes your portfolio and suggests trades',
      color: 'text-quantx-cyan',
      borderColor: 'border-quantx-cyan/30',
      hoverGlow: 'hover:shadow-glow-cyan'
    }
  ];

  const platformStats = [
    {
      icon: Activity,
      title: 'Live Market Data',
      description: 'Real-time streaming from NSE with tick-by-tick price updates, order book depth, and market breadth indicators',
      stat: 'Real-Time',
      color: 'text-quantx-blue',
      borderColor: 'border-quantx-blue/30'
    },
    {
      icon: Brain,
      title: 'ML Model Accuracy',
      description: 'Advanced neural networks trained on 5+ years of historical data with 25+ technical indicators for pattern recognition',
      stat: '85%+',
      color: 'text-quantx-cyan',
      borderColor: 'border-quantx-cyan/30'
    },
    {
      icon: DollarSign,
      title: 'Paper Trading Capital',
      description: 'Practice with ₹1,00,000 virtual money. Track P&L, test strategies, and build confidence before real trading',
      stat: '₹1L',
      color: 'text-quantx-green',
      borderColor: 'border-quantx-green/30'
    }
  ];

  const trustBadges = [
    { icon: Shield, text: 'Bank-Grade Security' },
    { icon: Zap, text: 'Real NSE Data' },
    { icon: Award, text: '100% Free Forever' },
    { icon: CheckCircle, text: 'No Credit Card Required' }
  ];

  return (
    <div className="min-h-screen bg-black grid-bg">
      {/* Header */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20, duration: 0.8 }}
        className="sticky top-0 z-50 bg-quantx-darkGrey/95 backdrop-blur-sm border-b border-quantx-green/20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-quantx-green/10 border border-quantx-green/30 rounded-lg flex items-center justify-center animate-pulse-glow">
                <TrendingUp className="w-5 h-5 text-quantx-green" />
              </div>
              <span className="text-xl font-bold text-white font-mono">QuantX <span className="text-quantx-green">Omega</span></span>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-5 py-2 bg-transparent border border-quantx-green text-quantx-green rounded-lg font-mono font-medium hover:bg-quantx-green hover:text-black hover:shadow-glow-green transition-all"
            >
              Launch App →
            </button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 80, damping: 20, duration: 1 }}
          className="text-center"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight font-mono">
            <span className="text-white">Trade Smarter</span>
            <br />
            <span className="text-quantx-green text-glow-green">With Neural AI</span>
          </h1>
          
          <p className="text-lg text-gray-400 mb-8 max-w-3xl mx-auto">
            Real-time NSE data, neural network predictions, paper trading, and an active community of traders. All in one powerful platform. Completely free.
          </p>

          <div className="flex items-center justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/dashboard')}
              className="group px-10 py-4 bg-quantx-green text-black rounded-lg font-mono font-semibold text-lg hover:shadow-glow-green transition-all flex items-center gap-3"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold mb-4 text-white font-mono">
            Everything You Need to Trade Successfully
          </h2>
          <p className="text-lg text-gray-500">
            Professional trading tools that were previously available only to institutions
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className={`bg-quantx-darkGrey p-8 rounded-lg border ${feature.borderColor} ${feature.hoverGlow} transition-all`}
            >
              <div className={`w-14 h-14 bg-quantx-mediumGrey rounded-lg flex items-center justify-center mb-5 border ${feature.borderColor}`}>
                <feature.icon className={`w-7 h-7 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white font-mono">{feature.title}</h3>
              <p className="text-gray-500 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Platform Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold mb-4 text-white font-mono">
            Platform Features
          </h2>
          <p className="text-lg text-gray-500">
            Real-time data and advanced trading tools at your fingertips
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {platformStats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              whileHover={{ y: -4 }}
              className={`bg-quantx-darkGrey p-8 rounded-lg border ${stat.borderColor} transition-all`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className={`w-14 h-14 bg-quantx-mediumGrey rounded-lg flex items-center justify-center border ${stat.borderColor}`}>
                  <stat.icon className={`w-7 h-7 ${stat.color}`} />
                </div>
                <div className={`text-3xl font-bold font-mono ${stat.color}`}>
                  {stat.stat}
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white font-mono">{stat.title}</h3>
              <p className="text-gray-500 leading-relaxed">{stat.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Leaderboard Preview Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold mb-4 text-white font-mono">
            Compete with Top Traders
          </h2>
          <p className="text-lg text-gray-500">
            Join our competitive leaderboard and see how you stack up against the best
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-quantx-darkGrey rounded-lg p-8 border border-quantx-green/20"
        >
          <div className="space-y-3">
            {[
              { rank: 1, name: 'TraderPro2024', returns: '+45.2%', sharpe: '2.8', trades: 127, badge: '🏆' },
              { rank: 2, name: 'InvestorKing', returns: '+38.7%', sharpe: '2.4', trades: 98, badge: '🥈' },
              { rank: 3, name: 'StockMaster', returns: '+32.1%', sharpe: '2.1', trades: 115, badge: '🥉' },
            ].map((trader, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ x: 4 }}
                className="flex items-center justify-between p-5 bg-quantx-black rounded-lg border border-quantx-green/10 hover:border-quantx-green/30 transition-all"
              >
                <div className="flex items-center gap-5">
                  <div className="text-3xl">{trader.badge}</div>
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-gray-400 font-mono">#{trader.rank}</span>
                      <span className="text-lg font-semibold text-white font-mono">{trader.name}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 font-mono">
                      <span>{trader.trades} trades</span>
                      <span>•</span>
                      <span>Sharpe: {trader.sharpe}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold font-mono ${
                    trader.rank === 1 ? 'text-quantx-yellow' : 
                    trader.rank === 2 ? 'text-gray-400' : 
                    'text-quantx-green'
                  }`}>
                    {trader.returns}
                  </div>
                  <div className="text-sm text-gray-500 font-mono">Total Returns</div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-8 text-center"
          >
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-transparent border border-quantx-green text-quantx-green rounded-lg font-mono font-medium hover:bg-quantx-green hover:text-black hover:shadow-glow-green transition-all"
            >
              View Full Leaderboard →
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* Trust Badges */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-quantx-darkGrey rounded-lg p-8 border border-quantx-green/20"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {trustBadges.map((badge, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center text-center cursor-pointer"
              >
                <div className="w-12 h-12 bg-quantx-mediumGrey rounded-lg flex items-center justify-center mb-3 border border-quantx-green/30">
                  <badge.icon className="w-6 h-6 text-quantx-green" />
                </div>
                <span className="font-mono text-gray-300 text-sm">{badge.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-quantx-darkGrey rounded-lg p-12 text-center border border-quantx-green/30 relative overflow-hidden"
        >
          {/* Glowing border effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-quantx-green/5 via-quantx-cyan/5 to-quantx-green/5 pointer-events-none" />
          
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white font-mono relative">
            Ready to Start Trading <span className="text-quantx-green">Smarter?</span>
          </h2>
          <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto relative">
            Join QuantX Omega today and get access to professional trading tools, neural AI insights, and an amazing community. No credit card required.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/dashboard')}
            className="px-12 py-4 bg-quantx-green text-black rounded-lg font-mono font-semibold text-xl hover:shadow-glow-green transition-all relative"
          >
            Get Started Now - It's Free!
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-quantx-green/20 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-quantx-green/10 border border-quantx-green/30 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-quantx-green" />
                </div>
                <span className="text-lg font-bold text-white font-mono">QuantX <span className="text-quantx-green">Omega</span></span>
              </div>
              <p className="text-gray-500 text-sm">
                India's most advanced neural AI-powered trading platform
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white font-mono">Product</h3>
              <ul className="space-y-2 text-gray-500 text-sm">
                <li><a href="/dashboard" className="hover:text-quantx-green transition-colors">Dashboard</a></li>
                <li><a href="/dashboard" className="hover:text-quantx-green transition-colors">Features</a></li>
                <li><a href="/dashboard" className="hover:text-quantx-green transition-colors">Pricing</a></li>
                <li><a href="/dashboard" className="hover:text-quantx-green transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white font-mono">Community</h3>
              <ul className="space-y-2 text-gray-500 text-sm">
                <li><a href="/dashboard" className="hover:text-quantx-green transition-colors">Forums</a></li>
                <li><a href="/dashboard" className="hover:text-quantx-green transition-colors">Discussions</a></li>
                <li><a href="/dashboard" className="hover:text-quantx-green transition-colors">Leaderboard</a></li>
                <li><a href="/dashboard" className="hover:text-quantx-green transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white font-mono">Legal</h3>
              <ul className="space-y-2 text-gray-500 text-sm">
                <li><a href="#" className="hover:text-quantx-green transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-quantx-green transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-quantx-green transition-colors">Disclaimer</a></li>
                <li><a href="#" className="hover:text-quantx-green transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-quantx-green/10 mt-8 pt-8 text-center text-sm text-gray-500 font-mono">
            © 2025 QuantX Omega. All rights reserved. Made with ❤️ for Indian traders.
          </div>
        </div>
      </footer>
    </div>
  );
}
