import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Save, Loader2, Edit2, X, AtSign, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';

const formSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username is too long')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .regex(/^[0-9+\-\s()]*$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
});

const ProfilePage: React.FC = () => {
  const { toast } = useToast();
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: '',
      username: '',
      phone: '',
    },
  });

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Check if profile exists
        const { data: existingProfile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (!existingProfile) {
          // First-time user - create profile
          setIsFirstTime(true);
          setIsEditing(true);
          
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email || '',
              full_name: user.user_metadata?.full_name || '',
            });

          if (insertError) throw insertError;
          
          // Refresh profile
          await refreshProfile();
          
          toast({
            title: 'Welcome!',
            description: 'Please complete your profile information.',
          });
        } else {
          // Load existing profile data
          form.reset({
            full_name: existingProfile.full_name || '',
            username: existingProfile.username || '',
            phone: existingProfile.phone || '',
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, refreshProfile]);

  // Update form when profile changes
  useEffect(() => {
    if (profile && !isEditing) {
      form.reset({
        full_name: profile.full_name || '',
        username: profile.username || '',
        phone: profile.phone || '',
      });
    }
  }, [profile, isEditing]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    // Revert to last saved values
    form.reset({
      full_name: profile?.full_name || '',
      username: profile?.username || '',
      phone: profile?.phone || '',
    });
    setIsEditing(false);
    setUsernameError(null);
    setIsFirstTime(false);
  };

  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    if (!username || username === profile?.username) {
      return true; // Empty or unchanged username is valid
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .neq('id', user?.id || '')
        .maybeSingle();

      if (error) throw error;
      
      return !data; // Available if no data found
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setSaving(true);
      setUsernameError(null);

      // Check username availability if username is provided and changed
      if (values.username && values.username !== profile?.username) {
        const isAvailable = await checkUsernameAvailability(values.username);
        if (!isAvailable) {
          setUsernameError('This username is already taken');
          setSaving(false);
          return;
        }
      }

      // Prepare updates
      const updates: { full_name?: string; username?: string; phone?: string | null } = {
        full_name: values.full_name,
        username: values.username || null,
        phone: values.phone || null,
      };

      const { error } = await updateProfile(updates);

      if (error) {
        throw error;
      }

      toast({
        title: 'Success!',
        description: 'Your profile has been updated.',
      });

      setIsEditing(false);
      setIsFirstTime(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      
      // Handle specific errors
      if (error.message?.includes('duplicate key') || error.message?.includes('username')) {
        setUsernameError('This username is already taken');
      } else {
        toast({
          title: 'Error',
          description: error.message || 'Failed to update profile. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle>Not Logged In</CardTitle>
            <CardDescription>Please log in to view your profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/login')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading profile...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 animate-fade-in"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {/* First-time user alert */}
          {isFirstTime && (
            <Alert className="mb-6 border-primary/50 bg-primary/10 animate-fade-in">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertDescription className="text-primary">
                Welcome to FINDIT.AI! Please complete your profile to get started.
              </AlertDescription>
            </Alert>
          )}

          {/* Profile Card */}
          <Card className="animate-slide-in">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">
                      {isEditing ? 'Edit Profile' : 'My Profile'}
                    </CardTitle>
                    <CardDescription>
                      {isEditing 
                        ? 'Update your personal information' 
                        : 'View and manage your account details'}
                    </CardDescription>
                  </div>
                </div>
                {!isEditing && !isFirstTime && (
                  <Button
                    onClick={handleEdit}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Full Name Field */}
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              placeholder="John Doe"
                              className="pl-10"
                              disabled={!isEditing}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          This name will be shown when you report items
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Username Field */}
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              placeholder="johndoe123"
                              className="pl-10"
                              disabled={!isEditing}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Unique username for your account (letters, numbers, and underscores only)
                        </FormDescription>
                        {usernameError && (
                          <p className="text-sm font-medium text-destructive">{usernameError}</p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Email Field (Read-only) */}
                  <div className="space-y-2">
                    <FormLabel>Email</FormLabel>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="email"
                        value={profile?.email || user?.email || ''}
                        disabled
                        className="pl-10 bg-muted cursor-not-allowed"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed
                    </p>
                  </div>

                  {/* Phone Field */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              placeholder="+1 (555) 123-4567"
                              className="pl-10"
                              disabled={!isEditing}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Optional contact number for item recovery
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Action Buttons */}
                  {isEditing && (
                    <div className="flex gap-3 pt-4">
                      <Button
                        type="submit"
                        disabled={saving}
                        className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/50"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                      {!isFirstTime && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancel}
                          disabled={saving}
                          className="flex-1"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Profile Info (when not editing) */}
                  {!isEditing && (
                    <div className="pt-4 border-t">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Account Created</p>
                          <p className="font-medium">
                            {profile?.created_at 
                              ? new Date(profile.created_at).toLocaleDateString()
                              : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Last Updated</p>
                          <p className="font-medium">
                            {profile?.updated_at 
                              ? new Date(profile.updated_at).toLocaleDateString()
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
