import React, { useState, useEffect } from 'react';
import { logger } from '../services/logger';

interface DbStatusResponse {
  status: 'connected' | 'disconnected' | 'error';
  timestamp: string;
  message?: string;
}

const getStatusColor = (status: DbStatusResponse | null): string => {
  if (!status) return '#6b7280';
  switch (status.status) {
    case 'connected': return '#22c55e';
    case 'disconnected': return '#ef4444';
    case 'error': return '#f59e0b';
    default: return '#6b7280';
  }
};

const getStatusText = (status: DbStatusResponse | null, loading: boolean): string => {
  if (loading) return 'Checking...';
  if (!status) return 'Not Ready';
  return status.status === 'connected' ? 'Ready' : 'Not Ready';
};

const buildDbUrl = (): string => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return `${baseUrl}/health/db`;
};

const createErrorStatus = (error: unknown): DbStatusResponse => {
  const errorMessage = error instanceof Error ? error.message : 'Failed to check database status';
  logger.error('Database status check failed', { error: errorMessage });
  return {
    status: 'error',
    timestamp: new Date().toISOString(),
    message: errorMessage
  };
};

const fetchDbStatus = async (): Promise<DbStatusResponse> => {
  const url = buildDbUrl();
  logger.debug('Fetching database status', { url });
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const result = await response.json();
  logger.info('Database status received', { response: result });
  return result.data || result;
};

const StatusIndicator = ({ status, loading }: { status: DbStatusResponse | null; loading: boolean }): React.ReactElement => (
  <>
    <div style={{ 
      width: '10px', 
      height: '10px', 
      borderRadius: '50%', 
      backgroundColor: getStatusColor(status) 
    }} />
    <span style={{ fontWeight: 500 }}>DB: {getStatusText(status, loading)}</span>
  </>
);

const RefreshButton = ({ onClick, loading }: { onClick: () => void; loading: boolean }): React.ReactElement => (
  <button
    onClick={onClick}
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
);

const useDbStatus = (): {
  status: DbStatusResponse | null;
  loading: boolean;
  lastCheck: Date | null;
  checkDbStatus: () => Promise<void>;
} => {
  const [status, setStatus] = useState<DbStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkDbStatus = async (): Promise<void> => {
    setLoading(true);
    logger.info('Checking database status');
    
    try {
      const statusData = await fetchDbStatus();
      setStatus(statusData);
      setLastCheck(new Date());
    } catch (error) {
      setStatus(createErrorStatus(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkDbStatus();
  }, []);

  return { status, loading, lastCheck, checkDbStatus };
};

export function DbStatus(): React.ReactElement {
  const { status, loading, lastCheck, checkDbStatus } = useDbStatus();

  return (
    <div style={{ 
      padding: '10px', 
      border: '1px solid #e5e7eb', 
      borderRadius: '6px',
      backgroundColor: '#f9fafb'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <StatusIndicator status={status} loading={loading} />
        <RefreshButton onClick={checkDbStatus} loading={loading} />
      </div>
      {lastCheck && (
        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
          Last checked: {lastCheck.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}