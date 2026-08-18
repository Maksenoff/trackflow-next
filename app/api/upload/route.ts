import { NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { auth } from '@/lib/auth'

// Upload direct navigateur → Vercel Blob (bypass la limite de taille de body des
// fonctions serverless) : ce endpoint ne fait que délivrer un token signé, les octets
// du fichier ne transitent jamais par notre serveur. Utilisé pour photo/bannière
// athlète et circulaire/horaires de compétition — tous derrière des formulaires déjà
// gated par rôle côté page.
export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
          'application/pdf',
        ],
        addRandomSuffix: true,
        maximumSizeInBytes: 8 * 1024 * 1024, // 8 Mo, cf. garde-fou déjà en place côté formulaire
      }),
      onUploadCompleted: async () => {
        // Rien à faire côté serveur : l'URL renvoyée au client est écrite dans le
        // formulaire puis persistée via le PATCH/POST athlete ou competition normal.
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload impossible' },
      { status: 400 }
    )
  }
}
