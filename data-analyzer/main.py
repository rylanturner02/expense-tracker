from fastapi import FastAPI, HTTPException
import psycopg2
import pandas as pd
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Data Analyzer Service")

# Database connection
def get_db_connection():
    return psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        port=os.getenv('DB_PORT', '5432'),
        database=os.getenv('DB_NAME', 'expense_tracker'),
        user=os.getenv('DB_USER', 'postgres'),
        password=os.getenv('DB_PASSWORD', 'password')
    )

@app.get("/")
def root():
    return {"service": "Data Analyzer", "status": "running"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.get("/analyze/moving-average/{symbol}")
def analyze_moving_average(symbol: str):
    """Simple moving average analysis"""
    try:
        conn = get_db_connection()
        query = """
        SELECT date, close_price 
        FROM market_data 
        WHERE symbol = %s 
        ORDER BY date DESC 
        LIMIT 20
        """
        df = pd.read_sql_query(query, conn, params=(symbol.upper(),))
        conn.close()
        
        if df.empty:
            raise HTTPException(status_code=404, detail=f"No data for {symbol}")
        
        # Calculate simple moving average
        df['close_price'] = df['close_price'].astype(float)
        avg_price = df['close_price'].mean()
        current_price = df['close_price'].iloc[0]
        
        # Simple trend analysis
        trend = "BULLISH" if current_price > avg_price else "BEARISH"
        
        return {
            "symbol": symbol.upper(),
            "current_price": float(current_price),
            "20_day_average": float(avg_price),
            "trend": trend,
            "analysis": f"Current price ${current_price:.2f} vs 20-day avg ${avg_price:.2f}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analyze/volatility/{symbol}")
def analyze_volatility(symbol: str):
    """Simple volatility analysis"""
    try:
        conn = get_db_connection()
        query = """
        SELECT date, close_price 
        FROM market_data 
        WHERE symbol = %s 
        ORDER BY date DESC 
        LIMIT 30
        """
        df = pd.read_sql_query(query, conn, params=(symbol.upper(),))
        conn.close()
        
        if len(df) < 2:
            raise HTTPException(status_code=404, detail=f"Insufficient data for {symbol}")
        
        # Calculate daily returns and volatility
        df['close_price'] = df['close_price'].astype(float)
        df = df.sort_values('date')
        df['daily_return'] = df['close_price'].pct_change()
        
        volatility = df['daily_return'].std()
        risk_level = "HIGH" if volatility > 0.03 else "MEDIUM" if volatility > 0.015 else "LOW"
        
        return {
            "symbol": symbol.upper(),
            "volatility": float(volatility),
            "risk_level": risk_level,
            "analysis": f"{symbol} has {risk_level} volatility ({volatility:.4f})"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analyze/portfolio")
def analyze_portfolio():
    """Portfolio overview analysis"""
    try:
        conn = get_db_connection()
        query = """
        SELECT symbol, AVG(close_price) as avg_price, COUNT(*) as data_points
        FROM market_data 
        GROUP BY symbol 
        ORDER BY symbol
        """
        df = pd.read_sql_query(query, conn)
        conn.close()
        
        portfolio = df.to_dict('records')
        total_symbols = len(portfolio)
        
        return {
            "total_symbols": total_symbols,
            "symbols": [p['symbol'] for p in portfolio],
            "portfolio_data": portfolio,
            "analysis": f"Portfolio contains {total_symbols} symbols with market data"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
