import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  demoLessons,
  getDemoLesson,
  getDueReviewLessons,
  getUnlockedLessons,
} from '../content/demoLearning'
import { runtimePiniaStorage, storageKeys } from '../services/storage'

export const useSessionStore = defineStore(
  'session',
  () => {
    const schemaVersion = ref(1)
    const activeLessonId = ref('kotlin-values')
    const completedToday = ref(3)
    const sessionMinutes = ref(18)
    const streakDays = ref(4)

    const activeLesson = computed(() => getDemoLesson(activeLessonId.value))
    const availableLessons = computed(() => getUnlockedLessons())
    const reviewLessons = computed(() => getDueReviewLessons())
    const overallProgress = computed(() => {
      const sum = demoLessons.reduce((total, lesson) => total + lesson.progress, 0)
      return Math.round(sum / demoLessons.length)
    })

    function setActiveLesson(lessonId: string): void {
      activeLessonId.value = getDemoLesson(lessonId).id
    }

    function recordDemoCompletion(): void {
      completedToday.value += 1
      sessionMinutes.value += 4
    }

    return {
      schemaVersion,
      activeLessonId,
      completedToday,
      sessionMinutes,
      streakDays,
      activeLesson,
      availableLessons,
      reviewLessons,
      overallProgress,
      setActiveLesson,
      recordDemoCompletion,
    }
  },
  {
    persist: {
      key: storageKeys.session,
      pick: ['schemaVersion', 'activeLessonId', 'completedToday', 'sessionMinutes', 'streakDays'],
      storage: runtimePiniaStorage,
    },
  },
)
