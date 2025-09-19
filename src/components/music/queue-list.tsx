'use client';

import type { Track } from "@/lib/types";
import { ScrollArea } from "../ui/scroll-area";
import Image from "next/image";
import { placeholderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";
import { Play } from "lucide-react";

type QueueListProps = {
    tracks: Track[];
    currentTrackId?: string;
    onSelectTrack: (trackId: string) => void;
}

export function QueueList({ tracks, currentTrackId, onSelectTrack }: QueueListProps) {
    const fallbackImage = placeholderImages[0];
    
    return (
        <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="flex flex-col gap-2 p-2">
                {tracks.map((track) => {
                    const isActive = track.id === currentTrackId;
                    return (
                        <div
                            key={track.id}
                            className={cn(
                                "group flex items-center p-2 gap-3 rounded-md cursor-pointer",
                                isActive ? "bg-primary/20" : "hover:bg-secondary"
                            )}
                            onClick={() => onSelectTrack(track.id)}
                        >
                            <div className="relative w-12 h-12 flex-shrink-0">
                                <Image
                                    src={track.thumbnail || fallbackImage.imageUrl}
                                    alt={track.title}
                                    width={48}
                                    height={48}
                                    className="rounded-md object-cover"
                                />
                                {isActive && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <Play className="w-5 h-5 fill-white text-white" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className={cn("font-semibold truncate", isActive && 'text-primary')}>{track.title}</p>

                                <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                            </div>
                        </div>
                    )
                })}
                 {tracks.length === 0 && (
                    <div className="text-center text-muted-foreground py-10">
                        The queue is empty.
                    </div>
                )}
            </div>
        </ScrollArea>
    )
}
