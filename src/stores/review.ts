import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useProgressStore } from './progress'

export const useReviewStore = defineStore('review', () => {
  const progress = useProgressStore()

  const queued = computed(() => progress.reviewQueue.filter((item) => item.state === 'queued'))
  const due = computed(() => {
    const now = Date.now()
    return progress.reviewQueue.filter(
      (item) => item.state === 'due' || Date.parse(item.schedule.dueAt) <= now,
    )
  })

  function suspend(reviewItemId: string): void {
    progress.reviewQueue = progress.reviewQueue.map((item) =>
      item.id === reviewItemId ? { ...item, state: 'suspended' } : item,
    )
  }

  return {
    queued,
    due,
    suspend,
  }
})
