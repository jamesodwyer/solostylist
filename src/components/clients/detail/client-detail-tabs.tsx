'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Client, ClientNote, ColourFormula, Tag } from '@/lib/types/database'
import { DetailsTab } from './details-tab'
import { NotesTab } from './notes-tab'
import { ColourTab } from './colour-tab'

interface ClientDetailTabsProps {
  client: Client
  notes: ClientNote[]
  colourFormulas: ColourFormula[]
  allTags: Tag[]
}

export function ClientDetailTabs({
  client,
  notes,
  colourFormulas,
  allTags,
}: ClientDetailTabsProps) {
  return (
    <Tabs defaultValue="details" className="flex-1 flex flex-col w-full">
      <TabsList className="w-full grid grid-cols-3 sticky top-0 bg-white z-10 rounded-none border-b border-gray-100 h-11">
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="notes">Notes</TabsTrigger>
        <TabsTrigger value="colour">Colour</TabsTrigger>
      </TabsList>
      <TabsContent value="details" className="flex-1 overflow-y-auto">
        <DetailsTab client={client} allTags={allTags} />
      </TabsContent>
      <TabsContent value="notes" className="flex-1 overflow-y-auto">
        <NotesTab
          clientId={client.id}
          notes={notes}
          colourFormulas={colourFormulas}
        />
      </TabsContent>
      <TabsContent value="colour" className="flex-1 overflow-y-auto">
        <ColourTab clientId={client.id} colourFormulas={colourFormulas} />
      </TabsContent>
    </Tabs>
  )
}
