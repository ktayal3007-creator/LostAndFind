import { X, FileText, FileImage, FileVideo, FileAudio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AttachmentPreviewProps {
  file: File;
  previewUrl?: string;
  onRemove: () => void;
  className?: string;
}

export function AttachmentPreview({ file, previewUrl, onRemove, className }: AttachmentPreviewProps) {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  const isAudio = file.type.startsWith('audio/');
  const isDocument = !isImage && !isVideo && !isAudio;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn("relative bg-muted rounded-lg p-3 flex items-center gap-3", className)}>
      {/* Preview Icon/Image */}
      <div className="flex-shrink-0">
        {isImage && previewUrl ? (
          <img 
            src={previewUrl} 
            alt={file.name}
            className="w-16 h-16 object-cover rounded"
          />
        ) : (
          <div className="w-16 h-16 bg-background rounded flex items-center justify-center">
            {isVideo && <FileVideo className="w-8 h-8 text-muted-foreground" />}
            {isAudio && <FileAudio className="w-8 h-8 text-muted-foreground" />}
            {isDocument && <FileText className="w-8 h-8 text-muted-foreground" />}
            {isImage && !previewUrl && <FileImage className="w-8 h-8 text-muted-foreground" />}
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
      </div>

      {/* Remove Button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="flex-shrink-0 h-8 w-8"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
