import { FileAudio, Download, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getChatAttachmentUrl } from '@/db/api';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MessageAttachmentProps {
  attachmentUrl: string;  // Can be storage path OR full URL
  attachmentFullUrl?: string | null;  // Preferred: full URL
  attachmentType: 'image' | 'video' | 'audio';  // NO documents
  attachmentName: string;
  attachmentSize?: number;
}

/**
 * REBUILT MESSAGE ATTACHMENT COMPONENT
 * 
 * CRITICAL FEATURES:
 * 1. Uses attachment_full_url if available (new messages)
 * 2. Falls back to converting attachment_url (legacy messages)
 * 3. Validates URL before rendering
 * 4. Comprehensive error handling and logging
 * 5. Explicit click handlers for all attachment types
 * 6. ONLY supports images, videos, and audio (NO documents)
 */
export function MessageAttachment({
  attachmentUrl,
  attachmentFullUrl,
  attachmentType,
  attachmentName,
  attachmentSize,
}: MessageAttachmentProps) {
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [finalUrl, setFinalUrl] = useState<string>('');
  const [urlError, setUrlError] = useState<string>('');

  useEffect(() => {
    // Determine the final URL to use
    let url = '';
    
    if (attachmentFullUrl) {
      // Prefer the full URL if available (new messages)
      console.log('[ATTACHMENT] Using full URL:', attachmentFullUrl);
      url = attachmentFullUrl;
    } else if (attachmentUrl) {
      // Fall back to converting storage path (legacy messages)
      console.log('[ATTACHMENT] Converting storage path:', attachmentUrl);
      url = getChatAttachmentUrl(attachmentUrl);
      console.log('[ATTACHMENT] Converted URL:', url);
    } else {
      console.error('[ATTACHMENT] No URL available');
      setUrlError('No attachment URL available');
      return;
    }

    // Validate URL
    if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
      console.error('[ATTACHMENT] Invalid URL:', url);
      setUrlError(`Invalid URL: ${url}`);
      return;
    }

    console.log('[ATTACHMENT] Final URL:', url);
    setFinalUrl(url);
    setUrlError('');
  }, [attachmentUrl, attachmentFullUrl]);
  
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    if (!finalUrl) {
      console.error('[ATTACHMENT] Cannot download: no URL');
      alert('Cannot download: file URL not available');
      return;
    }

    console.log('[ATTACHMENT] Downloading:', finalUrl);
    
    try {
      const link = document.createElement('a');
      link.href = finalUrl;
      link.download = attachmentName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('[ATTACHMENT] Download initiated');
    } catch (error) {
      console.error('[ATTACHMENT] Download error:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!finalUrl) {
      console.error('[ATTACHMENT] Cannot open image: no URL');
      return;
    }

    if (!imageError) {
      console.log('[ATTACHMENT] Opening image viewer:', finalUrl);
      setImageViewerOpen(true);
    }
  };

  const handleImageError = () => {
    console.error('[ATTACHMENT] Image failed to load:', finalUrl);
    setImageError(true);
  };

  // Show error if URL is invalid
  if (urlError || !finalUrl) {
    return (
      <Alert variant="destructive" className="mt-2">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {urlError || 'Failed to load attachment'}
        </AlertDescription>
      </Alert>
    );
  }

  // Image attachment
  if (attachmentType === 'image') {
    return (
      <>
        <div 
          className="mt-2 cursor-pointer rounded-lg overflow-hidden max-w-xs hover:opacity-90 transition-opacity"
          onClick={handleImageClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleImageClick(e as any);
            }
          }}
        >
          {imageError ? (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex flex-col items-center gap-2">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm">Failed to load image</p>
              <p className="text-xs opacity-70">{finalUrl}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          ) : (
            <img
              src={finalUrl}
              alt={attachmentName}
              className="w-full h-auto object-cover"
              loading="lazy"
              onError={handleImageError}
            />
          )}
        </div>

        {/* Image Viewer Dialog */}
        <Dialog open={imageViewerOpen} onOpenChange={setImageViewerOpen}>
          <DialogContent className="max-w-4xl p-0 bg-black/90">
            <div className="relative">
              <img
                src={finalUrl}
                alt={attachmentName}
                className="w-full h-auto max-h-[90vh] object-contain"
              />
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-4 right-4"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Video attachment
  if (attachmentType === 'video') {
    return (
      <div className="mt-2 rounded-lg overflow-hidden max-w-sm">
        <video
          src={finalUrl}
          controls
          className="w-full h-auto"
          preload="metadata"
          onError={(e) => {
            console.error('[ATTACHMENT] Video failed to load:', finalUrl);
            e.currentTarget.poster = '';
          }}
        >
          Your browser does not support the video tag.
        </video>
        <div className="bg-muted px-3 py-2 text-xs text-muted-foreground flex items-center justify-between">
          <span className="truncate flex-1">
            {attachmentName} {attachmentSize && `• ${formatFileSize(attachmentSize)}`}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-2 h-6 px-2"
            onClick={handleDownload}
          >
            <Download className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  // Audio attachment
  if (attachmentType === 'audio') {
    return (
      <div className="mt-2 bg-muted rounded-lg p-3 max-w-sm">
        <div className="flex items-center gap-2 mb-2">
          <FileAudio className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{attachmentName}</p>
            {attachmentSize && (
              <p className="text-xs text-muted-foreground">{formatFileSize(attachmentSize)}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-8 w-8"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
        <audio
          src={finalUrl}
          controls
          className="w-full"
          preload="metadata"
          onError={(e) => {
            console.error('[ATTACHMENT] Audio failed to load:', finalUrl);
          }}
        >
          Your browser does not support the audio tag.
        </audio>
      </div>
    );
  }

  // Unsupported attachment type
  return (
    <Alert variant="destructive" className="mt-2">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        Unsupported attachment type: {attachmentType}
      </AlertDescription>
    </Alert>
  );
}
