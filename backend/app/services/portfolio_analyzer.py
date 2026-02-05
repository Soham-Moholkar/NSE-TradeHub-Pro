from sqlalchemy.orm import Session
from typing import Dict, List, Tuple
from collections import defaultdict
import math

from app.models.trading import Portfolio, Position
from app.services.data_service import data_service


class PortfolioAnalyzer:
    """AI-powered portfolio analysis and health scoring"""
    
    def analyze_portfolio(self, db: Session, portfolio_id: int) -> Dict:
        """Comprehensive portfolio analysis"""
        portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
        if not portfolio:
            return {"error": "Portfolio not found"}
        
        positions = db.query(Position).filter(Position.portfolio_id == portfolio_id).all()
        
        # Calculate all metrics
        health_score = self._calculate_health_score(portfolio, positions)
        diversification = self._calculate_diversification(portfolio, positions)
        sector_allocation = self._calculate_sector_allocation(positions, portfolio.total_value)
        risk_assessment = self._calculate_risk_assessment(portfolio, positions)
        recommendations = self._generate_recommendations(portfolio, positions, sector_allocation, risk_assessment)
        
        # Update portfolio metrics
        portfolio.health_score = health_score
        portfolio.diversification_score = diversification["score"]
        db.commit()
        
        return {
            "health_score": health_score,
            "health_status": self._get_health_status(health_score),
            "diversification": diversification,
            "sector_allocation": sector_allocation,
            "risk_assessment": risk_assessment,
            "recommendations": recommendations,
            "total_value": portfolio.total_value,
            "cash_percentage": (portfolio.cash_balance / portfolio.total_value * 100) if portfolio.total_value > 0 else 0,
            "invested_percentage": ((portfolio.total_value - portfolio.cash_balance) / portfolio.total_value * 100) if portfolio.total_value > 0 else 0,
            "returns": portfolio.total_returns,
            "returns_percentage": portfolio.returns_percentage
        }
    
    def _calculate_health_score(self, portfolio: Portfolio, positions: List[Position]) -> float:
        """Calculate overall portfolio health score (0-100)"""
        score = 50.0  # Start from middle
        
        # Returns contribution (±30 points)
        if portfolio.returns_percentage > 0:
            score += min(30, portfolio.returns_percentage * 1.5)
        else:
            score += max(-30, portfolio.returns_percentage * 1.5)
        
        # Diversification contribution (±15 points)
        position_count = len(positions)
        if position_count == 0:
            score -= 15
        elif position_count == 1:
            score -= 10
        elif position_count == 2:
            score -= 5
        elif position_count >= 5:
            score += 15
        else:
            score += 5
        
        # Cash balance contribution (±10 points)
        cash_percent = (portfolio.cash_balance / portfolio.total_value * 100) if portfolio.total_value > 0 else 0
        if 10 <= cash_percent <= 30:
            score += 10  # Ideal cash range
        elif 5 <= cash_percent < 10 or 30 < cash_percent <= 40:
            score += 5   # Acceptable
        elif cash_percent < 5:
            score -= 5   # Too low
        elif cash_percent > 60:
            score -= 10  # Too much uninvested
        
        # Risk metrics contribution (±15 points)
        if portfolio.sharpe_ratio:
            if portfolio.sharpe_ratio > 2.0:
                score += 15
            elif portfolio.sharpe_ratio > 1.0:
                score += 10
            elif portfolio.sharpe_ratio > 0.5:
                score += 5
            elif portfolio.sharpe_ratio < 0:
                score -= 10
        
        if portfolio.max_drawdown:
            if abs(portfolio.max_drawdown) < 10:
                score += 5
            elif abs(portfolio.max_drawdown) > 30:
                score -= 10
        
        return max(0, min(100, score))
    
    def _get_health_status(self, health_score: float) -> str:
        """Get health status label"""
        if health_score >= 80:
            return "Excellent"
        elif health_score >= 65:
            return "Good"
        elif health_score >= 50:
            return "Fair"
        elif health_score >= 35:
            return "Needs Improvement"
        else:
            return "Poor"
    
    def _calculate_diversification(self, portfolio: Portfolio, positions: List[Position]) -> Dict:
        """Calculate diversification metrics"""
        if not positions:
            return {
                "score": 0,
                "status": "No positions",
                "position_count": 0,
                "concentration_risk": "N/A"
            }
        
        position_count = len(positions)
        total_invested = portfolio.total_value - portfolio.cash_balance
        
        # Calculate concentration (HHI - Herfindahl Index)
        concentration = 0
        largest_position_percent = 0
        
        if total_invested > 0:
            for position in positions:
                position_percent = (position.current_value / total_invested) if total_invested > 0 else 0
                concentration += position_percent ** 2
                largest_position_percent = max(largest_position_percent, position_percent * 100)
        
        # Diversification score (0-100)
        score = 0
        if position_count >= 10:
            score = 100
        elif position_count >= 7:
            score = 85
        elif position_count >= 5:
            score = 70
        elif position_count >= 3:
            score = 50
        elif position_count == 2:
            score = 30
        else:
            score = 10
        
        # Reduce score for high concentration
        if concentration > 0.5:  # Very concentrated
            score *= 0.5
        elif concentration > 0.3:
            score *= 0.7
        
        # Concentration risk assessment
        if concentration > 0.5:
            conc_risk = "High - Portfolio is very concentrated"
        elif concentration > 0.3:
            conc_risk = "Medium - Consider diversifying further"
        else:
            conc_risk = "Low - Well diversified"
        
        return {
            "score": round(score, 1),
            "status": self._get_diversification_status(score),
            "position_count": position_count,
            "concentration_index": round(concentration, 3),
            "concentration_risk": conc_risk,
            "largest_position_percent": round(largest_position_percent, 1)
        }
    
    def _get_diversification_status(self, score: float) -> str:
        """Get diversification status label"""
        if score >= 80:
            return "Well Diversified"
        elif score >= 60:
            return "Moderately Diversified"
        elif score >= 40:
            return "Limited Diversification"
        else:
            return "Poorly Diversified"
    
    def _calculate_sector_allocation(self, positions: List[Position], total_value: float) -> List[Dict]:
        """Calculate sector allocation"""
        sector_values = defaultdict(float)
        
        for position in positions:
            sector = position.sector or "Unknown"
            sector_values[sector] += position.current_value
        
        allocations = []
        for sector, value in sector_values.items():
            percentage = (value / total_value * 100) if total_value > 0 else 0
            allocations.append({
                "sector": sector,
                "value": value,
                "percentage": round(percentage, 2)
            })
        
        # Sort by percentage descending
        allocations.sort(key=lambda x: x["percentage"], reverse=True)
        
        return allocations
    
    def _calculate_risk_assessment(self, portfolio: Portfolio, positions: List[Position]) -> Dict:
        """Comprehensive risk assessment"""
        # Calculate portfolio volatility from positions
        if not positions:
            return {
                "overall_risk": "Low",
                "risk_score": 0,
                "volatility": 0,
                "beta": 0,
                "max_drawdown": 0,
                "sharpe_ratio": 0,
                "risk_factors": ["No positions - all cash"]
            }
        
        # Simulate some risk metrics (in real system, would calculate from historical data)
        position_count = len(positions)
        total_invested = portfolio.total_value - portfolio.cash_balance
        investment_ratio = total_invested / portfolio.total_value if portfolio.total_value > 0 else 0
        
        # Estimate volatility based on diversification and investment ratio
        base_volatility = 15.0  # Base market volatility
        diversification_factor = max(0.5, 1 - (position_count / 20))  # Less volatility with more positions
        estimated_volatility = base_volatility * diversification_factor * investment_ratio
        
        # Estimate beta (market sensitivity)
        estimated_beta = 0.8 + (investment_ratio * 0.4)  # More invested = higher beta
        
        # Use portfolio's actual metrics if available
        volatility = portfolio.volatility or estimated_volatility
        beta = portfolio.beta or estimated_beta
        max_drawdown = portfolio.max_drawdown or 0
        sharpe_ratio = portfolio.sharpe_ratio or 0
        
        # Calculate risk score (0-100, higher = riskier)
        risk_score = 0
        risk_score += min(40, volatility * 2)  # Volatility contribution
        risk_score += min(20, abs(beta - 1) * 20)  # Beta deviation from market
        risk_score += min(20, abs(max_drawdown) * 0.5)  # Drawdown impact
        risk_score -= min(20, sharpe_ratio * 10)  # Sharpe ratio reduces risk
        risk_score = max(0, min(100, risk_score))
        
        # Determine overall risk level
        if risk_score < 30:
            overall_risk = "Low"
        elif risk_score < 50:
            overall_risk = "Moderate"
        elif risk_score < 70:
            overall_risk = "High"
        else:
            overall_risk = "Very High"
        
        # Identify risk factors
        risk_factors = []
        if volatility > 20:
            risk_factors.append(f"High volatility ({volatility:.1f}%)")
        if abs(beta) > 1.3:
            risk_factors.append(f"High market sensitivity (β={beta:.2f})")
        if abs(max_drawdown) > 20:
            risk_factors.append(f"Significant drawdown ({max_drawdown:.1f}%)")
        if sharpe_ratio < 0.5:
            risk_factors.append("Low risk-adjusted returns")
        if investment_ratio > 0.95:
            risk_factors.append("Very low cash reserves")
        if position_count < 3:
            risk_factors.append("Limited diversification")
        
        if not risk_factors:
            risk_factors.append("Risk levels are within acceptable ranges")
        
        return {
            "overall_risk": overall_risk,
            "risk_score": round(risk_score, 1),
            "volatility": round(volatility, 2),
            "beta": round(beta, 2),
            "max_drawdown": round(max_drawdown, 2),
            "sharpe_ratio": round(sharpe_ratio, 2),
            "risk_factors": risk_factors
        }
    
    def _generate_recommendations(
        self, 
        portfolio: Portfolio, 
        positions: List[Position],
        sector_allocation: List[Dict],
        risk_assessment: Dict
    ) -> List[Dict]:
        """Generate AI-powered recommendations"""
        recommendations = []
        
        position_count = len(positions)
        cash_percent = (portfolio.cash_balance / portfolio.total_value * 100) if portfolio.total_value > 0 else 0
        
        # Diversification recommendations
        if position_count == 0:
            recommendations.append({
                "type": "diversification",
                "priority": "high",
                "title": "Start Investing",
                "description": "Your portfolio is 100% cash. Consider investing in diversified positions to start building returns.",
                "action": "Browse stocks and make your first investment"
            })
        elif position_count < 5:
            recommendations.append({
                "type": "diversification",
                "priority": "medium",
                "title": "Increase Diversification",
                "description": f"You have only {position_count} position(s). Aim for at least 5-7 different stocks to reduce risk.",
                "action": "Add more positions from different sectors"
            })
        
        # Cash balance recommendations
        if cash_percent > 50 and position_count > 0:
            recommendations.append({
                "type": "allocation",
                "priority": "medium",
                "title": "High Cash Balance",
                "description": f"{cash_percent:.1f}% of your portfolio is in cash. Consider investing more for better returns.",
                "action": "Deploy excess cash into quality stocks"
            })
        elif cash_percent < 5 and position_count > 0:
            recommendations.append({
                "type": "allocation",
                "priority": "high",
                "title": "Low Cash Reserve",
                "description": "Less than 5% cash. Maintain some liquidity for opportunities or rebalancing.",
                "action": "Consider taking profits or adding funds"
            })
        
        # Sector concentration recommendations
        if sector_allocation:
            top_sector = sector_allocation[0]
            if top_sector["percentage"] > 40:
                recommendations.append({
                    "type": "sector",
                    "priority": "medium",
                    "title": "Sector Concentration",
                    "description": f"{top_sector['sector']} represents {top_sector['percentage']:.1f}% of your portfolio. Consider diversifying across sectors.",
                    "action": f"Add positions from other sectors"
                })
        
        # Risk-based recommendations
        if risk_assessment["risk_score"] > 70:
            recommendations.append({
                "type": "risk",
                "priority": "high",
                "title": "High Risk Level",
                "description": "Your portfolio has elevated risk. Consider rebalancing to reduce volatility.",
                "action": "Review positions and increase diversification"
            })
        
        # Performance recommendations
        if portfolio.returns_percentage < -10:
            recommendations.append({
                "type": "performance",
                "priority": "high",
                "title": "Portfolio Down 10%+",
                "description": "Review underperforming positions. Consider cutting losses or averaging down on quality stocks.",
                "action": "Analyze individual positions"
            })
        elif portfolio.returns_percentage > 20:
            recommendations.append({
                "type": "performance",
                "priority": "low",
                "title": "Strong Performance",
                "description": "Your portfolio is up 20%+! Consider taking some profits or rebalancing.",
                "action": "Review profit-taking opportunities"
            })
        
        # Position-specific recommendations
        for position in positions:
            if position.unrealized_pnl_percent < -15:
                recommendations.append({
                    "type": "position",
                    "priority": "medium",
                    "title": f"{position.symbol} Down 15%+",
                    "description": f"{position.symbol} is down {abs(position.unrealized_pnl_percent):.1f}%. Review the thesis for this position.",
                    "action": f"Analyze {position.symbol} fundamentals"
                })
            elif position.unrealized_pnl_percent > 30:
                recommendations.append({
                    "type": "position",
                    "priority": "low",
                    "title": f"{position.symbol} Up 30%+",
                    "description": f"{position.symbol} has strong gains. Consider taking partial profits.",
                    "action": f"Review exit strategy for {position.symbol}"
                })
        
        # Limit to top 5 recommendations
        return sorted(recommendations, key=lambda x: {"high": 0, "medium": 1, "low": 2}[x["priority"]])[:5]


# Singleton instance
portfolio_analyzer = PortfolioAnalyzer()
