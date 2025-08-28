import { useState, useEffect, useMemo } from 'react';
import { logger } from '../services/logger';

interface DbStatusResponse {
  status: 'connected' | 'disconnected' | 'error';
  timestamp: string;
  message?: string;
}

export function DbStatus() {
  const [status, setStatus] = useState<DbStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkDbStatus = async () => {
    setLoading(true);
    logger.info('Checking database status');
    
    try {
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/health/db`;
      logger.debug('Fetching database status', { url });
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      logger.info('Database status received', { response: result });
      
      // Handle the wrapped response format from backend
      const statusData = result.data || result;
      setStatus(statusData);
      setLastCheck(new Date());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check database status';
      logger.error('Database status check failed', { error: errorMessage });
      
      setStatus({
        status: 'error',
        timestamp: new Date().toISOString(),
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkDbStatus();
  }, []);

  const statusColor = useMemo(() => {
    if (!status) return '#6b7280';
    switch (status.status) {
      case 'connected': return '#22c55e';  // Brighter green
      case 'disconnected': return '#ef4444';
      case 'error': return '#f59e0b';
      default: return '#6b7280';
    }
  }, [status]);

  const statusText = useMemo(() => {
    if (loading) return 'Checking...';
    if (!status) return 'Not Ready';
    return status.status === 'connected' ? 'Ready' : 'Not Ready';
  }, [status, loading]);

  return (
    <div style={{ 
      padding: '10px', 
      border: '1px solid #e5e7eb', 
      borderRadius: '6px',
      backgroundColor: '#f9fafb'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div 
          style={{ 
            width: '10px', 
            height: '10px', 
            borderRadius: '50%', 
            backgroundColor: statusColor 
          }} 
        />
        <span style={{ fontWeight: 500 }}>DB: {statusText}</span>
        <button
          onClick={checkDbStatus}
          disabled={loading}
          style={{
            marginLeft: 'auto',
            padding: '4px 8px',
            fontSize: '12px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1
          }}
        >
          Refresh
        </button>
      </div>
      {lastCheck && (
        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
          Last checked: {lastCheck.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}