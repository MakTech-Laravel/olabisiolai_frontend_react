import { Loader2, Save } from 'lucide-react'

import { Button } from '@/components/ui/button'

type Props = {
  dirty: boolean
  saving?: boolean
  disabled?: boolean
  onDiscard: () => void
  onSave: () => void
}

export function ActionButtons({ dirty, saving, disabled, onDiscard, onSave }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        type="button"
        variant="outline"
        disabled={!dirty || saving || disabled}
        onClick={onDiscard}
        className="min-w-[140px] border-foreground/20 bg-card font-inter"
      >
        Discard changes
      </Button>
      <Button
        type="button"
        disabled={!dirty || saving || disabled}
        onClick={onSave}
        className="min-w-[160px] bg-brand-red font-inter font-semibold text-white shadow-sm hover:bg-brand-red/90"
      >
        {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />}
        Save changes
      </Button>
    </div>
  )
}
