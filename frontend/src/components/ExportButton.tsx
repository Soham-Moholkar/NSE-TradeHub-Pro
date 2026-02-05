'use client';

import React, { useState } from 'react';
import { 
  Download, FileText, FileSpreadsheet, Share2, 
  CheckCircle, Loader2, FileDown, Image
} from 'lucide-react';

interface ExportOptions {
  portfolioData?: any;
  tradesData?: any[];
  watchlistData?: any[];
  chartRef?: React.RefObject<HTMLDivElement>;
}

export default function ExportButton({ 
  portfolioData, 
  tradesData = [], 
  watchlistData = [],
  chartRef 
}: ExportOptions) {
  const [showMenu, setShowMenu] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Export Portfolio to CSV
  const exportPortfolioCSV = () => {
    setExporting('portfolio-csv');
    try {
      const headers = ['Symbol', 'Quantity', 'Average Price', 'Current Price', 'Market Value', 'P&L', 'P&L %'];
      
      // Demo data if no real data
      const positions = portfolioData?.positions || [
        { symbol: 'RELIANCE', quantity: 10, average_price: 2850, current_price: 2920 },
        { symbol: 'TCS', quantity: 5, average_price: 3800, current_price: 3850 },
        { symbol: 'HDFCBANK', quantity: 8, average_price: 1650, current_price: 1620 }
      ];

      const rows = positions.map((pos: any) => {
        const marketValue = pos.quantity * pos.current_price;
        const costBasis = pos.quantity * pos.average_price;
        const pnl = marketValue - costBasis;
        const pnlPercent = (pnl / costBasis) * 100;
        
        return [
          pos.symbol,
          pos.quantity,
          pos.average_price.toFixed(2),
          pos.current_price.toFixed(2),
          marketValue.toFixed(2),
          pnl.toFixed(2),
          pnlPercent.toFixed(2) + '%'
        ].join(',');
      });

      const csv = [headers.join(','), ...rows].join('\n');
      downloadFile(csv, 'portfolio_export.csv', 'text/csv');
      
      setSuccess('portfolio-csv');
      setTimeout(() => setSuccess(null), 2000);
    } catch (error) {
      console.error('Export error:', error);
    }
    setExporting(null);
    setShowMenu(false);
  };

  // Export Trades to CSV
  const exportTradesCSV = () => {
    setExporting('trades-csv');
    try {
      const headers = ['Date', 'Symbol', 'Type', 'Quantity', 'Price', 'Total Value', 'Status'];
      
      // Demo data if no real data
      const trades = tradesData.length > 0 ? tradesData : [
        { date: new Date(), symbol: 'RELIANCE', type: 'BUY', quantity: 10, price: 2850, status: 'COMPLETED' },
        { date: new Date(Date.now() - 86400000), symbol: 'TCS', type: 'BUY', quantity: 5, price: 3800, status: 'COMPLETED' },
        { date: new Date(Date.now() - 172800000), symbol: 'INFY', type: 'SELL', quantity: 8, price: 1550, status: 'COMPLETED' }
      ];

      const rows = trades.map((trade: any) => [
        formatDate(trade.date || trade.created_at || new Date()),
        trade.symbol,
        trade.type || trade.trade_type,
        trade.quantity,
        trade.price.toFixed(2),
        (trade.quantity * trade.price).toFixed(2),
        trade.status
      ].join(','));

      const csv = [headers.join(','), ...rows].join('\n');
      downloadFile(csv, 'trades_export.csv', 'text/csv');
      
      setSuccess('trades-csv');
      setTimeout(() => setSuccess(null), 2000);
    } catch (error) {
      console.error('Export error:', error);
    }
    setExporting(null);
    setShowMenu(false);
  };

  // Export Watchlist to CSV
  const exportWatchlistCSV = () => {
    setExporting('watchlist-csv');
    try {
      const headers = ['Symbol', 'Name', 'Current Price', 'Change', 'Change %', 'Volume'];
      
      // Demo data if no real data
      const watchlist = watchlistData.length > 0 ? watchlistData : [
        { symbol: 'RELIANCE', name: 'Reliance Industries', price: 2920, change: 35, changePercent: 1.21, volume: 15000000 },
        { symbol: 'TCS', name: 'Tata Consultancy Services', price: 3850, change: -25, changePercent: -0.65, volume: 8500000 },
        { symbol: 'HDFCBANK', name: 'HDFC Bank Limited', price: 1620, change: 18, changePercent: 1.12, volume: 12000000 }
      ];

      const rows = watchlist.map((stock: any) => [
        stock.symbol,
        stock.name || stock.symbol,
        stock.price?.toFixed(2) || stock.current_price?.toFixed(2) || '-',
        stock.change?.toFixed(2) || '-',
        (stock.changePercent?.toFixed(2) || stock.change_percent?.toFixed(2) || '-') + '%',
        stock.volume || '-'
      ].join(','));

      const csv = [headers.join(','), ...rows].join('\n');
      downloadFile(csv, 'watchlist_export.csv', 'text/csv');
      
      setSuccess('watchlist-csv');
      setTimeout(() => setSuccess(null), 2000);
    } catch (error) {
      console.error('Export error:', error);
    }
    setExporting(null);
    setShowMenu(false);
  };

  // Generate PDF Report (simplified - creates HTML that can be printed as PDF)
  const exportPDFReport = () => {
    setExporting('pdf');
    try {
      const positions = portfolioData?.positions || [
        { symbol: 'RELIANCE', quantity: 10, average_price: 2850, current_price: 2920 },
        { symbol: 'TCS', quantity: 5, average_price: 3800, current_price: 3850 }
      ];

      const totalValue = positions.reduce((sum: number, p: any) => sum + (p.quantity * p.current_price), 0);
      const totalCost = positions.reduce((sum: number, p: any) => sum + (p.quantity * p.average_price), 0);
      const totalPnL = totalValue - totalCost;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>NSE Stock Analysis Report</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
            .header h1 { color: #1e40af; margin: 0; }
            .header p { color: #64748b; margin-top: 5px; }
            .section { margin: 30px 0; }
            .section h2 { color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
            th { background: #f8fafc; color: #475569; font-weight: 600; }
            .positive { color: #16a34a; }
            .negative { color: #dc2626; }
            .summary { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
            .summary-item { text-align: center; }
            .summary-item .label { color: #64748b; font-size: 14px; }
            .summary-item .value { font-size: 24px; font-weight: bold; color: #1e293b; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 NSE Stock Analysis Report</h1>
            <p>Generated on ${formatDate(new Date())} | Paper Trading Account</p>
          </div>
          
          <div class="summary">
            <div class="summary-grid">
              <div class="summary-item">
                <div class="label">Total Portfolio Value</div>
                <div class="value">${formatCurrency(totalValue)}</div>
              </div>
              <div class="summary-item">
                <div class="label">Total Investment</div>
                <div class="value">${formatCurrency(totalCost)}</div>
              </div>
              <div class="summary-item">
                <div class="label">Overall P&L</div>
                <div class="value ${totalPnL >= 0 ? 'positive' : 'negative'}">${formatCurrency(totalPnL)}</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <h2>Portfolio Holdings</h2>
            <table>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Qty</th>
                  <th>Avg Price</th>
                  <th>Current</th>
                  <th>Value</th>
                  <th>P&L</th>
                </tr>
              </thead>
              <tbody>
                ${positions.map((pos: any) => {
                  const value = pos.quantity * pos.current_price;
                  const cost = pos.quantity * pos.average_price;
                  const pnl = value - cost;
                  return `
                    <tr>
                      <td><strong>${pos.symbol}</strong></td>
                      <td>${pos.quantity}</td>
                      <td>${formatCurrency(pos.average_price)}</td>
                      <td>${formatCurrency(pos.current_price)}</td>
                      <td>${formatCurrency(value)}</td>
                      <td class="${pnl >= 0 ? 'positive' : 'negative'}">${formatCurrency(pnl)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="footer">
            <p>This report is for paper trading simulation purposes only. Not financial advice.</p>
            <p>Generated by NSE Stock Analysis Platform</p>
          </div>
        </body>
        </html>
      `;

      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (win) {
        win.onload = () => {
          setTimeout(() => win.print(), 500);
        };
      }
      
      setSuccess('pdf');
      setTimeout(() => setSuccess(null), 2000);
    } catch (error) {
      console.error('Export error:', error);
    }
    setExporting(null);
    setShowMenu(false);
  };

  // Share via Web Share API
  const shareReport = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'NSE Stock Analysis Report',
          text: 'Check out my stock portfolio performance!',
          url: window.location.href
        });
        setSuccess('share');
        setTimeout(() => setSuccess(null), 2000);
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy link
      navigator.clipboard.writeText(window.location.href);
      setSuccess('share');
      setTimeout(() => setSuccess(null), 2000);
    }
    setShowMenu(false);
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportOptions = [
    { id: 'portfolio-csv', label: 'Portfolio (CSV)', icon: FileSpreadsheet, action: exportPortfolioCSV },
    { id: 'trades-csv', label: 'Trades (CSV)', icon: FileSpreadsheet, action: exportTradesCSV },
    { id: 'watchlist-csv', label: 'Watchlist (CSV)', icon: FileSpreadsheet, action: exportWatchlistCSV },
    { id: 'pdf', label: 'Full Report (PDF)', icon: FileText, action: exportPDFReport },
    { id: 'share', label: 'Share Report', icon: Share2, action: shareReport },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
      >
        <Download className="w-4 h-4" />
        <span>Export</span>
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-slideUp">
            <div className="p-2">
              {exportOptions.map((option) => {
                const Icon = option.icon;
                const isExporting = exporting === option.id;
                const isSuccess = success === option.id;
                
                return (
                  <button
                    key={option.id}
                    onClick={option.action}
                    disabled={isExporting}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left"
                  >
                    {isExporting ? (
                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    ) : isSuccess ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    )}
                    <span className="text-gray-700 dark:text-gray-300">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
