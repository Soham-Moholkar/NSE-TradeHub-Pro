"""
Script to train ML models for popular NSE stocks
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.db import engine, SessionLocal
from app.services.ml_service import ml_service
from app.services.data_service import DataService
from app.services.nse_service import nse_service
import pandas as pd

# Popular NSE stocks to train models for
STOCKS_TO_TRAIN = [
    "RELIANCE",
    "TCS",
    "HDFCBANK",
    "INFY",
    "ICICIBANK",
    "HINDUNILVR",
    "SBIN",
    "BHARTIARTL",
    "KOTAKBANK",
    "ITC",
    "LT",
    "AXISBANK",
    "ASIANPAINT",
    "WIPRO",
    "MARUTI",
]

def train_all_models(force_retrain: bool = False):
    """Train ML models for all popular stocks"""
    db: Session = SessionLocal()
    
    print("=" * 60)
    print("NSE Stock ML Model Training")
    print("=" * 60)
    print(f"Training models for {len(STOCKS_TO_TRAIN)} stocks")
    print(f"Force retrain: {force_retrain}")
    print("=" * 60)
    
    results = []
    
    for i, symbol in enumerate(STOCKS_TO_TRAIN, 1):
        print(f"\n[{i}/{len(STOCKS_TO_TRAIN)}] Processing {symbol}...")
        
        try:
            # Fetch historical data (at least 1 year)
            to_date = datetime.now()
            from_date = to_date - timedelta(days=365 * 2)  # 2 years of data
            
            print(f"  Fetching data from {from_date.date()} to {to_date.date()}...")
            
            # Ensure we have data in the database
            prices = DataService.fetch_and_store_prices(db, symbol, from_date, to_date)
            
            if not prices or len(prices) < 100:
                print(f"  ⚠ Insufficient data for {symbol}: {len(prices) if prices else 0} records")
                results.append({
                    "symbol": symbol,
                    "status": "SKIPPED",
                    "reason": "Insufficient data"
                })
                continue
            
            # Convert to DataFrame
            df = pd.DataFrame([{
                'date': p.date,
                'open': p.open,
                'high': p.high,
                'low': p.low,
                'close': p.close,
                'volume': p.volume
            } for p in prices])
            
            print(f"  Training model with {len(df)} data points...")
            
            # Train the model
            training_result = ml_service.train_model(symbol, df, force_retrain=force_retrain)
            
            if "accuracy" in training_result:
                print(f"  ✓ Model trained successfully!")
                print(f"    Accuracy: {training_result['accuracy']:.2%}")
                print(f"    Precision: {training_result['precision']:.2%}")
                print(f"    Recall: {training_result['recall']:.2%}")
                print(f"    F1 Score: {training_result['f1_score']:.2%}")
                
                results.append({
                    "symbol": symbol,
                    "status": "SUCCESS",
                    "accuracy": training_result['accuracy'],
                    "precision": training_result['precision'],
                    "recall": training_result['recall'],
                    "f1_score": training_result['f1_score']
                })
            else:
                print(f"  ℹ {training_result.get('message', 'Model exists')}")
                results.append({
                    "symbol": symbol,
                    "status": "EXISTS",
                    "message": training_result.get('message', 'Model already exists')
                })
                
        except Exception as e:
            print(f"  ✗ Error training {symbol}: {str(e)}")
            results.append({
                "symbol": symbol,
                "status": "ERROR",
                "error": str(e)
            })
    
    db.close()
    
    # Print summary
    print("\n" + "=" * 60)
    print("TRAINING SUMMARY")
    print("=" * 60)
    
    success_count = sum(1 for r in results if r["status"] == "SUCCESS")
    exists_count = sum(1 for r in results if r["status"] == "EXISTS")
    error_count = sum(1 for r in results if r["status"] == "ERROR")
    skipped_count = sum(1 for r in results if r["status"] == "SKIPPED")
    
    print(f"✓ Successfully trained: {success_count}")
    print(f"ℹ Already existed: {exists_count}")
    print(f"⚠ Skipped (no data): {skipped_count}")
    print(f"✗ Errors: {error_count}")
    
    # Show accuracy summary for successful models
    successful = [r for r in results if r["status"] == "SUCCESS"]
    if successful:
        print("\nModel Performance:")
        print("-" * 40)
        for r in successful:
            print(f"  {r['symbol']:12} | Acc: {r['accuracy']:.2%} | F1: {r['f1_score']:.2%}")
        
        avg_accuracy = sum(r['accuracy'] for r in successful) / len(successful)
        avg_f1 = sum(r['f1_score'] for r in successful) / len(successful)
        print("-" * 40)
        print(f"  {'Average':12} | Acc: {avg_accuracy:.2%} | F1: {avg_f1:.2%}")
    
    print("\n" + "=" * 60)
    print("Training complete!")
    print("=" * 60)
    
    return results

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Train ML models for NSE stocks")
    parser.add_argument("--force", "-f", action="store_true", 
                        help="Force retrain even if models exist")
    parser.add_argument("--symbols", "-s", nargs="+", 
                        help="Specific symbols to train (default: all popular stocks)")
    
    args = parser.parse_args()
    
    if args.symbols:
        STOCKS_TO_TRAIN = [s.upper() for s in args.symbols]
    
    train_all_models(force_retrain=args.force)
