import type { ContentManifest } from '../domain/model'

export const currentContentVersion = '2026.07.foundation'

export const contentManifest = {
  schemaVersion: 1,
  contentVersion: currentContentVersion,
  courseId: 'kotlin-core',
  sections: [
    {
      id: 'foundations',
      title: 'Фундамент Kotlin',
      moduleIds: ['module.kotlin-foundations'],
    },
  ],
} satisfies ContentManifest
