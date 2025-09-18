import { Download } from 'lucide-react';

export default function DownloadsPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:p-8 flex flex-col items-center justify-center h-full text-center">
       <Download className="w-24 h-24 text-muted-foreground mb-4" />
      <h1 className="text-3xl font-bold font-headline">Downloads</h1>
      <p className="text-muted-foreground mt-2">
        Your downloaded tracks for offline playback will appear here. This feature is coming soon!
      </p>
    </div>
  );
}
