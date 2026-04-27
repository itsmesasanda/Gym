import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';

const ProtectedUserRoute = ({ children }) => {
  const { user, loading } = useUserAuth();

  if (loading) {
    return (
      <div style={styles.loader}>
        <p style={styles.text}>Verifying member session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/user/login" replace />;
  }

  return children;
};

const styles = {
  loader: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-primary)',
  },
  text: {
    color: 'var(--text-secondary)',
    fontSize: '14px',
  },
};

export default ProtectedUserRoute;
