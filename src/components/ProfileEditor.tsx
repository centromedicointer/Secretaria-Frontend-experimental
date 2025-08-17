import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, User, Save } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { profileSchema, type ProfileFormData } from '@/lib/validation';

const ProfileEditor = () => {
  const { profile, loading, updateProfile, checkUsernameAvailability } = useProfile();
  const { toast } = useToast();
  const [formData, setFormData] = useState<ProfileFormData>({
    username: '',
    full_name: ''
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormData, string>>>({});

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        full_name: profile.full_name || ''
      });
    }
  }, [profile]);

  const validateField = async (field: keyof ProfileFormData, value: string) => {
    try {
      if (field === 'username') {
        profileSchema.shape.username.parse(value);
        // Check username availability if changed
        if (value !== profile?.username && value.length >= 3) {
          const isAvailable = await checkUsernameAvailability(value);
          if (!isAvailable) {
            throw new Error('Username is already taken');
          }
        }
      } else if (field === 'full_name') {
        profileSchema.shape.full_name.parse(value);
      }
      
      setErrors(prev => ({ ...prev, [field]: undefined }));
      return true;
    } catch (error: any) {
      const errorMessage = error.message || `Invalid ${field}`;
      setErrors(prev => ({ ...prev, [field]: errorMessage }));
      return false;
    }
  };

  const handleFieldChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Debounced validation
    setTimeout(() => validateField(field, value), 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate entire form
      const validatedData = profileSchema.parse(formData);
      
      // Check for validation errors
      const hasErrors = await Promise.all([
        validateField('username', formData.username),
        validateField('full_name', formData.full_name)
      ]);
      
      if (hasErrors.some(valid => !valid)) {
        return;
      }

      setSaving(true);

      const changes: { username?: string; full_name?: string } = {};
      
      if (validatedData.username !== (profile?.username || '')) {
        changes.username = validatedData.username;
      }
      
      if (validatedData.full_name !== (profile?.full_name || '')) {
        changes.full_name = validatedData.full_name;
      }

      if (Object.keys(changes).length > 0) {
        await updateProfile(changes);
        toast({
          title: 'Profile updated',
          description: 'Your profile has been successfully updated.',
        });
      } else {
        toast({
          title: 'No changes',
          description: 'No changes were made to your profile.',
        });
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      
      if (error.issues) {
        // Zod validation errors
        error.issues.forEach((issue: any) => {
          setErrors(prev => ({ 
            ...prev, 
            [issue.path[0]]: issue.message 
          }));
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update profile. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Edit Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => handleFieldChange('username', e.target.value)}
              className={errors.username ? 'border-red-500' : ''}
              placeholder="your_username"
              disabled={saving}
            />
            {errors.username && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.username}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={formData.full_name}
              onChange={(e) => handleFieldChange('full_name', e.target.value)}
              className={errors.full_name ? 'border-red-500' : ''}
              placeholder="Your full name"
              disabled={saving}
            />
            {errors.full_name && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.full_name}</AlertDescription>
              </Alert>
            )}
          </div>

          <Button 
            type="submit" 
            disabled={saving || Object.keys(errors).some(key => errors[key as keyof ProfileFormData])}
            className="w-full"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProfileEditor;