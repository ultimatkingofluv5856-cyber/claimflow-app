import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Image, FileText, Download, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AttachmentPreviewProps {
  fileIds: string[];
  claimId: string;
  compact?: boolean;
}

function getPublicUrl(fileId: string) {
  const { data } = supabase.storage.from('claim-attachments').getPublicUrl(fileId);
  return data?.publicUrl || '';
}

function isImage(name: string) {
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(name);
}

function isPdf(name: string) {
  return /\.pdf$/i.test(name);
}

export default function AttachmentPreview({ fileIds, claimId, compact = false }: AttachmentPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'image' | 'pdf' | 'other'>('other');

  if (!fileIds || fileIds.length === 0) {
    return <p className="text-sm text-muted-foreground italic">No attachments</p>;
  }

  const openPreview = (fileId: string) => {
    const url = getPublicUrl(fileId);
    if (isImage(fileId)) {
      setPreviewType('image');
    } else if (isPdf(fileId)) {
      setPreviewType('pdf');
    } else {
      setPreviewType('other');
    }
    setPreviewUrl(url);
  };

  const handleViewInNewTab = (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    const url = getPublicUrl(fileId);
    window.open(url, '_blank');
  };

  const handleDownload = (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    const url = getPublicUrl(fileId);
    const a = document.createElement('a');
    a.href = url;
    a.download = getFileName(fileId);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getFileName = (fileId: string) => {
    const parts = fileId.split('/');
    return parts[parts.length - 1] || fileId;
  };

  return (
    <div>
      {!compact && (
        <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
          <Image className="h-4 w-4" /> Attachments ({fileIds.length})
        </h4>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {fileIds.map((fileId, idx) => {
          const url = getPublicUrl(fileId);
          const name = getFileName(fileId);
          const imgFile = isImage(fileId);

          return (
            <div
              key={idx}
              className="border border-border rounded-lg overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all group relative"
            >
              <div 
                className="cursor-pointer"
                onClick={() => openPreview(fileId)}
              >
                {imgFile ? (
                  <div className="aspect-square bg-muted/30 flex items-center justify-center overflow-hidden">
                    <img src={url} alt={name} className="object-cover w-full h-full group-hover:scale-105 transition-transform" loading="lazy" />
                  </div>
                ) : (
                  <div className="aspect-square bg-muted/30 flex flex-col items-center justify-center gap-1 p-2">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground text-center truncate w-full">{name}</span>
                  </div>
                )}
              </div>
              {/* Action buttons overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="h-7 w-7 bg-white/90 hover:bg-white"
                  onClick={(e) => handleDownload(e, fileId)}
                  title="Download"
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Attachment Preview
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={previewUrl || ''} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" /> Open
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={previewUrl || ''} download>
                    <Download className="h-4 w-4 mr-1" /> Download
                  </a>
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[70vh] flex items-center justify-center">
            {previewType === 'image' && previewUrl && (
              <img src={previewUrl} alt="Preview" className="max-w-full max-h-[65vh] object-contain rounded" />
            )}
            {previewType === 'pdf' && previewUrl && (
              <iframe src={previewUrl} className="w-full h-[65vh] rounded border" title="PDF Preview" />
            )}
            {previewType === 'other' && (
              <div className="text-center p-8">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Preview not available for this file type.</p>
                <Button variant="outline" className="mt-4" asChild>
                  <a href={previewUrl || ''} download><Download className="h-4 w-4 mr-1" /> Download File</a>
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
