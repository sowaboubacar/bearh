import type { IDocument } from '~/core/entities/document.entity.server';

export function getFirstImage(attachments: IDocument[]): IDocument | null {
  if(!attachments) return null;
  return attachments.find((attachment) => attachment?.file?.meta?.mimeType?.startsWith('image/')) || null;
}