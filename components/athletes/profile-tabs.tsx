'use client'

import { TrendingUp, CalendarDays, Trophy, Target, Video, StickyNote } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PerformancesTab } from '@/components/athletes/tabs/performances-tab'
import { SessionsTab } from '@/components/athletes/tabs/sessions-tab'
import { CompetitionsTab } from '@/components/athletes/tabs/competitions-tab'
import { GoalsTab } from '@/components/athletes/tabs/goals-tab'
import { VideosTab } from '@/components/athletes/tabs/videos-tab'
import { NotesTab } from '@/components/athletes/tabs/notes-tab'
import type { AthleteDetail } from '@/lib/athletes-data'

export function ProfileTabs({ athlete, canEdit }: { athlete: AthleteDetail; canEdit: boolean }) {
  return (
    <Tabs defaultValue="performances" className="gap-4">
      <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
        <TabsTrigger
          value="performances"
          className="gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 data-active:border-primary/40 data-active:bg-primary/10"
        >
          <TrendingUp className="size-3.5" />
          Performances
        </TabsTrigger>
        <TabsTrigger
          value="sessions"
          className="gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 data-active:border-primary/40 data-active:bg-primary/10"
        >
          <CalendarDays className="size-3.5" />
          Séances
        </TabsTrigger>
        <TabsTrigger
          value="competitions"
          className="gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 data-active:border-primary/40 data-active:bg-primary/10"
        >
          <Trophy className="size-3.5" />
          Compétitions
        </TabsTrigger>
        <TabsTrigger
          value="goals"
          className="gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 data-active:border-primary/40 data-active:bg-primary/10"
        >
          <Target className="size-3.5" />
          Objectifs
        </TabsTrigger>
        <TabsTrigger
          value="videos"
          className="gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 data-active:border-primary/40 data-active:bg-primary/10"
        >
          <Video className="size-3.5" />
          Vidéos
        </TabsTrigger>
        <TabsTrigger
          value="notes"
          className="gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 data-active:border-primary/40 data-active:bg-primary/10"
        >
          <StickyNote className="size-3.5" />
          Notes
          {athlete.notesList.length > 0 && (
            <span className="rounded-full bg-muted px-1.5 text-[10px] font-bold">
              {athlete.notesList.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="performances">
        <PerformancesTab performances={athlete.performances} />
      </TabsContent>
      <TabsContent value="sessions">
        <SessionsTab
          athleteSessions={athlete.athleteSessions}
          customSessions={athlete.customSessions}
        />
      </TabsContent>
      <TabsContent value="competitions">
        <CompetitionsTab registrations={athlete.competitionRegistrations} />
      </TabsContent>
      <TabsContent value="goals">
        <GoalsTab athleteId={athlete.id} goals={athlete.goals} canEdit={canEdit} />
      </TabsContent>
      <TabsContent value="videos">
        <VideosTab videos={athlete.videos} />
      </TabsContent>
      <TabsContent value="notes">
        <NotesTab athleteId={athlete.id} notes={athlete.notesList} canEdit={canEdit} />
      </TabsContent>
    </Tabs>
  )
}
