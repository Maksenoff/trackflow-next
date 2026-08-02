import { Video, PlayCircle } from 'lucide-react'
import { formatFullDate } from '@/lib/date'
import type { AthleteDetail } from '@/lib/athletes-data'

type AthleteVideo = AthleteDetail['videos'][number]

export function VideosTab({ videos }: { videos: AthleteVideo[] }) {
  if (videos.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card py-16 text-center shadow-sm">
        <Video className="mx-auto mb-3 size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Aucune vidéo enregistrée.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {videos.map((video) => (
        <a
          key={video.id}
          href={video.url}
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
        >
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <PlayCircle className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{video.title}</div>
            <div className="text-xs text-muted-foreground">
              {video.discipline ? `${video.discipline} · ` : ''}
              {formatFullDate(video.createdAt)}
            </div>
          </div>
        </a>
      ))}
    </div>
  )
}
