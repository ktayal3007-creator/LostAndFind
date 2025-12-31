import React, { useEffect, useState } from 'react';
import { PackageX, Plus, Upload, X, Image as ImageIcon } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { createLostItem, getLostItemById, triggerAutoMatch } from '@/db/api';
import ItemCard from '@/components/common/ItemCard';
import type { LostItemWithProfile, LostItemInput } from '@/types/types';
import { CATEGORIES, CAMPUSES } from '@/types/types';
import { useAuth } from '@/contexts/AuthContext';
import { uploadImage } from '@/lib/storage';
import { Alert, AlertDescription } from '@/components/ui/alert';

const formSchema = z.object({
  item_name: z.string().min(3, 'Item name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Please select a category'),
  date_lost: z.string().min(1, 'Please select a date'),
  location: z.string().min(3, 'Location must be at least 3 characters'),
  campus: z.string().min(1, 'Please select a campus'),
  additional_info: z.string().optional(),
});

const ReportLostPage: React.FC = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [myReports, setMyReports] = useState<LostItemWithProfile[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      item_name: '',
      description: '',
      category: '',
      date_lost: '',
      location: '',
      campus: '',
      additional_info: '',
    },
  });

  useEffect(() => {
    loadMyReports();
  }, []);

  const loadMyReports = async () => {
    try {
      setLoadingReports(true);
      const reportIds = JSON.parse(localStorage.getItem('myLostReports') || '[]');
      const reports = await Promise.all(
        reportIds.map((id: string) => getLostItemById(id))
      );
      setMyReports(reports.filter((r): r is LostItemWithProfile => r !== null));
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB maximum)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Image size must be less than or equal to 5MB',
        variant: 'destructive',
      });
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Only JPG, PNG, and WEBP images are allowed',
        variant: 'destructive',
      });
      return;
    }

    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Check if user is logged in
      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'Please sign in to submit a report.',
          variant: 'destructive',
        });
        // Redirect to login with return path
        window.location.href = '/login?redirect=/report-lost';
        return;
      }

      setSubmitting(true);
      
      // Upload image if provided
      let imageUrl: string | undefined = undefined;
      if (imageFile) {
        setUploadingImage(true);
        const { url, error } = await uploadImage(imageFile, 'lost_items');
        setUploadingImage(false);
        
        if (error) {
          toast({
            title: 'Image upload failed',
            description: error,
            variant: 'destructive',
          });
          setSubmitting(false);
          return;
        }
        
        imageUrl = url || undefined;
      }

      const itemData: LostItemInput = {
        user_id: user.id,
        item_name: values.item_name,
        description: values.description,
        category: values.category,
        date_lost: values.date_lost,
        location: values.location,
        campus: values.campus,
        additional_info: values.additional_info || undefined,
        image_url: imageUrl,
      };

      const newItem = await createLostItem(itemData);

      // Trigger AI matching in the background
      triggerAutoMatch('lost', newItem.id);

      // Save to localStorage
      const reportIds = JSON.parse(localStorage.getItem('myLostReports') || '[]');
      reportIds.unshift(newItem.id);
      localStorage.setItem('myLostReports', JSON.stringify(reportIds));

      toast({
        title: 'Success!',
        description: 'Your lost item report has been submitted. We\'ll notify you if we find a match!',
      });

      form.reset();
      removeImage();
      loadMyReports();
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-8 animate-fade-in">
          <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center">
            <PackageX className="w-7 h-7 text-destructive" />
          </div>
          <div>
            <h1 className="text-3xl xl:text-4xl font-bold">Report Lost Item</h1>
            <p className="text-muted-foreground">
              Help us help you find your lost item
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Form */}
          <div className="xl:col-span-2">
            <Card className="animate-slide-in">
              <CardHeader>
                <CardTitle>Item Details</CardTitle>
                <CardDescription>
                  Please provide as much detail as possible to help others identify your item
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="item_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Black Leather Wallet" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your item in detail..."
                              className="min-h-24"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {CATEGORIES.map((cat) => (
                                  <SelectItem key={cat} value={cat}>
                                    {cat}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="date_lost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date Lost *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Main Library, 3rd Floor" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="campus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Main Location *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select main location" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CAMPUSES.map((campus) => (
                                <SelectItem key={campus} value={campus}>
                                  {campus}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Image Upload */}
                    <div className="space-y-2">
                      <FormLabel>Item Image (Optional)</FormLabel>
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                        {!imagePreview ? (
                          <label htmlFor="image-upload" className="cursor-pointer block">
                            <div className="flex flex-col items-center space-y-2">
                              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                <Upload className="w-8 h-8 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">Click to upload image</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  JPG, PNG, or WEBP (max 1MB)
                                </p>
                              </div>
                            </div>
                            <input
                              id="image-upload"
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/webp"
                              onChange={handleImageChange}
                              className="hidden"
                            />
                          </label>
                        ) : (
                          <div className="relative">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="max-h-48 mx-auto rounded-lg"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2"
                              onClick={removeImage}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <FormDescription>
                        Adding an image helps others identify your item more easily
                      </FormDescription>
                    </div>

                    {/* Auto-fill info for logged-in users */}
                    {user && (
                      <Alert>
                        <ImageIcon className="h-4 w-4" />
                        <AlertDescription>
                          Your contact information ({profile?.full_name || 'Anonymous'}, {profile?.email}) will be automatically included with this report.
                        </AlertDescription>
                      </Alert>
                    )}

                    <FormField
                      control={form.control}
                      name="additional_info"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Information</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any other details that might help..."
                              className="min-h-20"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" size="lg" disabled={submitting || uploadingImage} className="w-full">
                      <Plus className="w-5 h-5 mr-2" />
                      {uploadingImage ? 'Uploading Image...' : submitting ? 'Submitting...' : 'Submit Report'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* My Reports */}
          <div className="xl:col-span-1">
            <Card className="animate-fade-in sticky top-20">
              <CardHeader>
                <CardTitle>My Reports</CardTitle>
                <CardDescription>Your submitted lost item reports</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingReports ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : myReports.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <PackageX className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No reports yet</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {myReports.map((item) => (
                      <ItemCard key={item.id} item={item} type="lost" />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportLostPage;
