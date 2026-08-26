import { upload } from '@vercel/blob/client'

/**
 * Upload direct navigateur → Vercel Blob (voir app/api/blob/upload/route.ts). `folder`
 * préfixe le chemin de stockage (ex: "athletes/photos") pour garder les fichiers
 * organisés dans le dashboard Blob.
 */
export async function uploadFile(file: File, folder: string): Promise<string> {
  const blob = await upload(`${folder}/${file.name}`, file, {
    access: 'public',
    handleUploadUrl: '/api/blob/upload',
  })
  return blob.url
}
