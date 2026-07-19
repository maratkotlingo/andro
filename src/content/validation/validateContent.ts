import { loadAllContentPackages, validateContentPackages } from '../registry'

export async function validateContentOrThrow(): Promise<void> {
  const packages = await loadAllContentPackages()
  const issues = validateContentPackages(packages)

  if (issues.length > 0) {
    throw new Error(issues.map((issue) => `${issue.code}: ${issue.message}`).join('\n'))
  }
}
