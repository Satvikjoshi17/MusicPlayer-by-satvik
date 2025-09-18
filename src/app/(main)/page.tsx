import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { placeholderImages } from '@/lib/placeholder-images';
import { SearchBar } from '@/components/music/search-bar';

export default function HomePage() {
  const recommended = placeholderImages.slice(0, 4);
  const recent = placeholderImages.slice(4, 8);

  return (
    <div className="container mx-auto px-4 py-8 md:p-8 space-y-12">
      <header className="text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tighter text-primary">
          Welcome to Satvik Beats
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Search, stream, and enjoy your favorite music.
        </p>
      </header>

      <div className="max-w-2xl mx-auto">
        <SearchBar />
      </div>

      <section>
        <h2 className="text-2xl font-bold font-headline mb-4">Recommended For You</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {recommended.map((item, index) => (
            <Card key={item.id} className="bg-secondary border-0 overflow-hidden group">
              <CardContent className="p-0">
                <div className="aspect-square relative">
                  <Image
                    src={item.imageUrl}
                    alt={item.description}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    data-ai-hint={item.imageHint}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                </div>
                <div className="p-3 absolute bottom-0 left-0">
                   <h3 className="font-semibold text-sm truncate text-foreground">{item.description}</h3>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold font-headline mb-4">Recently Played</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {recent.map((item) => (
            <Card key={item.id} className="bg-secondary border-0 overflow-hidden group">
              <CardContent className="p-0">
                <div className="aspect-square relative">
                  <Image
                    src={item.imageUrl}
                    alt={item.description}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    data-ai-hint={item.imageHint}
                  />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                </div>
                <div className="p-3 absolute bottom-0 left-0">
                  <h3 className="font-semibold text-sm truncate text-foreground">{item.description}</h3>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
