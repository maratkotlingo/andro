export type AppTab = {
  value: string
  label: string
}

export type BreadcrumbItem = {
  label: string
  to?: string
}

export type DropdownItem = {
  id: string
  label: string
  description?: string
  separatorBefore?: boolean
}

export type SelectOption = {
  value: string
  label: string
}
