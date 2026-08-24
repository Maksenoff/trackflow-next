'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IosInstallDialog } from '@/components/pwa/ios-install-dialog'
import { useInstallPrompt } from '@/lib/use-install-prompt'

// Bouton d'installation PWA visible directement dans le pied de la sidebar
// (à gauche du toggle jour/nuit) — auparavant planqué dans le menu déroulant
// du compte, donc peu visible. Se masque tout seul une fois l'app installée.
export function PwaInstallButton() {
  const { canInstall, isIOS, isStandalone, promptInstall } = useInstallPrompt()
  const [iosDialogOpen, setIosDialogOpen] = useState(false)
  const showInstall = !isStandalone && (canInstall || isIOS)

  if (!showInstall) return null

  async function handleInstall() {
    if (canInstall) await promptInstall()
    else if (isIOS) setIosDialogOpen(true)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="size-9"
        aria-label="Installer l'application"
        title="Installer l'application"
        onClick={handleInstall}
      >
        <Download className="size-4" />
      </Button>
      <IosInstallDialog open={iosDialogOpen} onOpenChange={setIosDialogOpen} />
    </>
  )
}
