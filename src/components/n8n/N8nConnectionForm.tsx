import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Shield } from 'lucide-react';
import { n8nConnectionSchema, type N8nConnectionFormData } from '@/lib/validation';

interface N8nConfig {
  baseUrl: string;
  apiKey: string;
  workflowId?: string;
}

interface N8nConnectionFormProps {
  isConnecting: boolean;
  onConnect: (config: N8nConfig) => Promise<void>;
}

export const N8nConnectionForm: React.FC<N8nConnectionFormProps> = ({ 
  isConnecting, 
  onConnect 
}) => {
  const [formData, setFormData] = useState<N8nConnectionFormData>({
    baseUrl: '',
    apiKey: '',
    workflowId: ''
  });
  const [errors, setErrors] = useState<Partial<Record<keyof N8nConnectionFormData, string>>>({});

  const validateField = (field: keyof N8nConnectionFormData, value: string) => {
    try {
      if (field === 'baseUrl') {
        n8nConnectionSchema.shape.baseUrl.parse(value);
      } else if (field === 'apiKey') {
        n8nConnectionSchema.shape.apiKey.parse(value);
      } else if (field === 'workflowId' && value) {
        n8nConnectionSchema.shape.workflowId.parse(value);
      }
      
      setErrors(prev => ({ ...prev, [field]: undefined }));
      return true;
    } catch (error: any) {
      const errorMessage = error.issues?.[0]?.message || `Invalid ${field}`;
      setErrors(prev => ({ ...prev, [field]: errorMessage }));
      return false;
    }
  };

  const handleInputChange = (field: keyof N8nConnectionFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Debounced validation for better UX
    setTimeout(() => validateField(field, value), 300);
  };

  const handleSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    try {
      // Validate entire form
      const validatedData = n8nConnectionSchema.parse(formData);
      
      // Check for any validation errors
      const fieldsValid = [
        validateField('baseUrl', formData.baseUrl),
        validateField('apiKey', formData.apiKey),
        formData.workflowId ? validateField('workflowId', formData.workflowId) : true
      ];
      
      if (fieldsValid.every(Boolean)) {
        // Ensure we have the required fields for N8nConfig
        const config: N8nConfig = {
          baseUrl: validatedData.baseUrl,
          apiKey: validatedData.apiKey,
          workflowId: validatedData.workflowId || undefined
        };
        onConnect(config);
      }
    } catch (error: any) {
      console.error('Form validation error:', error);
      if (error.issues) {
        error.issues.forEach((issue: any) => {
          setErrors(prev => ({ 
            ...prev, 
            [issue.path[0]]: issue.message 
          }));
        });
      }
    }
  };

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="baseUrl">N8n Base URL *</Label>
        <Input
          id="baseUrl"
          placeholder="https://your-n8n-instance.io"
          value={formData.baseUrl}
          onChange={(e) => handleInputChange('baseUrl', e.target.value)}
          disabled={isConnecting}
          className={errors.baseUrl ? 'border-red-500' : ''}
        />
        {errors.baseUrl && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.baseUrl}</AlertDescription>
          </Alert>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="apiKey">API Key *</Label>
        <Input
          id="apiKey"
          type="password"
          placeholder="Your secure n8n API key"
          value={formData.apiKey}
          onChange={(e) => handleInputChange('apiKey', e.target.value)}
          disabled={isConnecting}
          className={errors.apiKey ? 'border-red-500' : ''}
        />
        {errors.apiKey && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.apiKey}</AlertDescription>
          </Alert>
        )}
        <p className="text-xs text-muted-foreground">
          Your API key is encrypted and stored securely
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="workflowId">Workflow ID (Optional)</Label>
        <Input
          id="workflowId"
          placeholder="Specific workflow ID"
          value={formData.workflowId || ''}
          onChange={(e) => handleInputChange('workflowId', e.target.value)}
          disabled={isConnecting}
          className={errors.workflowId ? 'border-red-500' : ''}
        />
        {errors.workflowId && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.workflowId}</AlertDescription>
          </Alert>
        )}
      </div>

      <Button 
        onClick={handleSubmit} 
        disabled={isConnecting || Object.keys(errors).some(key => errors[key as keyof N8nConnectionFormData])}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {isConnecting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Shield className="mr-2 h-4 w-4" />
            Connect Securely
          </>
        )}
      </Button>
    </>
  );
};