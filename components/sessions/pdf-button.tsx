'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PdfButton() {
  return (
    <Button variant="outline" size="sm" className="print:hidden" onClick={() => window.print()}>
      <Download className="size-3.5" />
      PDF
    </Button>
  )
}
