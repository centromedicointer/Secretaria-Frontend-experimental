import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SecurityEvent {
  type: 'login_failed' | 'permission_denied' | 'data_access' | 'suspicious_activity';
  message: string;
  metadata?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface SecurityMetrics {
  failedLogins: number;
  permissionDenials: number;
  suspiciousActivities: number;
  lastSecurityEvent?: Date;
}

export const useSecurityMonitoring = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    failedLogins: 0,
    permissionDenials: 0,
    suspiciousActivities: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Log security event
  const logSecurityEvent = async (event: SecurityEvent) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const logEntry = {
        user_id: user?.id || null,
        event_type: event.type,
        message: event.message,
        metadata: event.metadata || {},
        severity: event.severity,
        ip_address: await getClientIP(),
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };

      // In a real implementation, you'd log this to a security_events table
      console.warn('Security Event:', logEntry);

      // Show critical security alerts to admins
      if (event.severity === 'critical') {
        const { data: isAdmin } = await supabase.rpc('is_current_user_admin');
        if (isAdmin) {
          toast({
            title: 'Security Alert',
            description: event.message,
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  };

  // Get client IP (simplified - in production use a proper service)
  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch {
      return 'unknown';
    }
  };

  // Monitor failed login attempts
  const trackFailedLogin = (email?: string) => {
    logSecurityEvent({
      type: 'login_failed',
      message: `Failed login attempt${email ? ` for ${email}` : ''}`,
      metadata: { email },
      severity: 'medium'
    });
    
    setMetrics(prev => ({
      ...prev,
      failedLogins: prev.failedLogins + 1,
      lastSecurityEvent: new Date()
    }));
  };

  // Monitor permission denials
  const trackPermissionDenial = (resource: string, action: string) => {
    logSecurityEvent({
      type: 'permission_denied',
      message: `Access denied to ${resource} for ${action}`,
      metadata: { resource, action },
      severity: 'high'
    });

    setMetrics(prev => ({
      ...prev,
      permissionDenials: prev.permissionDenials + 1,
      lastSecurityEvent: new Date()
    }));
  };

  // Monitor suspicious activities
  const trackSuspiciousActivity = (description: string, metadata?: Record<string, any>) => {
    logSecurityEvent({
      type: 'suspicious_activity',
      message: description,
      metadata,
      severity: 'critical'
    });

    setMetrics(prev => ({
      ...prev,
      suspiciousActivities: prev.suspiciousActivities + 1,
      lastSecurityEvent: new Date()
    }));
  };

  // Monitor data access patterns
  const trackDataAccess = (table: string, action: 'read' | 'write' | 'delete', recordCount?: number) => {
    const isHighVolume = recordCount && recordCount > 100;
    
    if (isHighVolume) {
      logSecurityEvent({
        type: 'data_access',
        message: `High volume data access: ${action} ${recordCount} records from ${table}`,
        metadata: { table, action, recordCount },
        severity: 'medium'
      });
    }
  };

  // Validate input for potential security threats
  const validateInput = (input: string, context: string): boolean => {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+=/i,
      /union.*select/i,
      /drop.*table/i,
      /exec/i,
      /eval/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(input)) {
        trackSuspiciousActivity(`Potentially malicious input detected in ${context}`, {
          input: input.substring(0, 100), // Limit logged input length
          context,
          pattern: pattern.toString()
        });
        return false;
      }
    }
    return true;
  };

  // Check for session anomalies
  const checkSessionSecurity = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const now = Date.now();
      const sessionAge = now - (session.expires_at ? session.expires_at * 1000 : 0);
      
      // Alert if session is about to expire
      if (sessionAge > -300000 && sessionAge < 0) { // 5 minutes before expiry
        console.warn('Session expiring soon');
      }

      // Check for concurrent sessions (simplified)
      const lastActivity = localStorage.getItem('lastActivity');
      const currentActivity = now.toString();
      
      if (lastActivity) {
        const timeDiff = now - parseInt(lastActivity);
        if (timeDiff < 1000) { // Multiple requests within 1 second might indicate automation
          trackSuspiciousActivity('Rapid succession of requests detected', {
            timeDiff,
            userAgent: navigator.userAgent
          });
        }
      }
      
      localStorage.setItem('lastActivity', currentActivity);
    } catch (error) {
      console.error('Session security check failed:', error);
    }
  };

  useEffect(() => {
    // Run initial security check
    checkSessionSecurity();
    
    // Set up periodic security monitoring
    const interval = setInterval(checkSessionSecurity, 30000); // Every 30 seconds
    
    setLoading(false);

    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    loading,
    trackFailedLogin,
    trackPermissionDenial,
    trackSuspiciousActivity,
    trackDataAccess,
    validateInput,
    logSecurityEvent
  };
};