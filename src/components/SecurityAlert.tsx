import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Eye, EyeOff, Clock, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface SecurityIssue {
  id: string;
  type: 'rls_disabled' | 'weak_permissions' | 'exposed_data' | 'outdated_session';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action?: string;
  dismissed?: boolean;
}

const SecurityAlert: React.FC = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState<SecurityIssue[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    if (isAdmin) {
      performSecurityScan();
    }
  }, [user, isAdmin]);

  const checkAdminStatus = async () => {
    if (!user) return;
    try {
      const { data } = await supabase.rpc('is_current_user_admin');
      setIsAdmin(!!data);
    } catch (error) {
      console.error('Failed to check admin status:', error);
    }
  };

  const performSecurityScan = async () => {
    const securityIssues: SecurityIssue[] = [];

    // Check session age
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const sessionAge = Date.now() - (session.expires_at ? session.expires_at * 1000 : 0);
      if (sessionAge > -3600000) { // Less than 1 hour remaining
        securityIssues.push({
          id: 'session_expiry',
          type: 'outdated_session',
          title: 'Session Expiring Soon',
          description: 'Your session will expire soon. Please save your work.',
          severity: 'medium',
          action: 'Refresh session'
        });
      }
    }

    // Check for development environment indicators
    if (window.location.hostname === 'localhost' || window.location.hostname.includes('preview')) {
      securityIssues.push({
        id: 'dev_environment',
        type: 'weak_permissions',
        title: 'Development Environment',
        description: 'You are in a development environment. Ensure production has proper security configurations.',
        severity: 'low',
        action: 'Review production settings'
      });
    }

    // Check for console logging (security risk in production)
    const originalLog = console.log;
    let consoleUsage = 0;
    console.log = (...args) => {
      consoleUsage++;
      originalLog.apply(console, args);
    };

    setTimeout(() => {
      console.log = originalLog;
      if (consoleUsage > 10 && !window.location.hostname.includes('localhost')) {
        securityIssues.push({
          id: 'console_logging',
          type: 'exposed_data',
          title: 'Excessive Console Logging',
          description: 'High amount of console logging detected. This may expose sensitive information.',
          severity: 'medium',
          action: 'Review console outputs'
        });
      }
    }, 5000);

    // Check localStorage for sensitive data
    const sensitiveKeys = ['password', 'secret', 'token', 'key'];
    const localStorageKeys = Object.keys(localStorage);
    const exposedKeys = localStorageKeys.filter(key => 
      sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))
    );

    if (exposedKeys.length > 0) {
      securityIssues.push({
        id: 'localStorage_exposure',
        type: 'exposed_data',
        title: 'Potentially Sensitive Data in localStorage',
        description: `Found keys that might contain sensitive information: ${exposedKeys.join(', ')}`,
        severity: 'high',
        action: 'Review stored data'
      });
    }

    setIssues(securityIssues);
  };

  const dismissIssue = (issueId: string) => {
    setDismissed(prev => new Set([...prev, issueId]));
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'medium': return <Shield className="h-4 w-4 text-yellow-600" />;
      case 'low': return <Shield className="h-4 w-4 text-blue-600" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const visibleIssues = issues.filter(issue => !dismissed.has(issue.id));
  const criticalIssues = visibleIssues.filter(issue => issue.severity === 'critical');
  const displayIssues = showAll ? visibleIssues : criticalIssues;

  if (!isAdmin || visibleIssues.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6 border-amber-200 bg-amber-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <Shield className="h-5 w-5" />
          Security Dashboard
          {criticalIssues.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {criticalIssues.length} Critical
            </Badge>
          )}
        </CardTitle>
        <div className="flex justify-between items-center">
          <p className="text-sm text-amber-700">
            {visibleIssues.length} security issue{visibleIssues.length !== 1 ? 's' : ''} detected
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="text-amber-800"
          >
            {showAll ? (
              <>
                <EyeOff className="h-4 w-4 mr-1" />
                Critical Only
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-1" />
                Show All ({visibleIssues.length})
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {displayIssues.map((issue) => (
          <Alert key={issue.id} variant={getSeverityColor(issue.severity) as any}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2 flex-1">
                {getSeverityIcon(issue.severity)}
                <div className="flex-1">
                  <AlertTitle className="text-sm font-medium">
                    {issue.title}
                    <Badge variant="outline" className="ml-2 text-xs">
                      {issue.severity.toUpperCase()}
                    </Badge>
                  </AlertTitle>
                  <AlertDescription className="text-sm mt-1">
                    {issue.description}
                    {issue.action && (
                      <div className="mt-2">
                        <Badge variant="secondary" className="text-xs">
                          Recommended: {issue.action}
                        </Badge>
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dismissIssue(issue.id)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </Alert>
        ))}
        
        {dismissed.size > 0 && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {dismissed.size} issue{dismissed.size !== 1 ? 's' : ''} dismissed
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SecurityAlert;