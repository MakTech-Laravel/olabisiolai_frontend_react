import { showError, showSuccess } from '@/lib/sweetAlert'

export function appOrigin(): string {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin
  }

  return 'https://gidira.com'
}

export async function shareLink(options: {
  title: string
  text?: string
  url: string
  copiedMessage?: string
}): Promise<void> {
  const payload = {
    title: options.title,
    text: options.text,
    url: options.url,
  }

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share(payload)
      return
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }
    }
  }

  try {
    await navigator.clipboard.writeText(options.url)
    showSuccess(options.copiedMessage ?? 'Link copied to clipboard.')
  } catch {
    showError('Could not share or copy the link. Please try again.')
  }
}

export async function shareGidiraApp(): Promise<void> {
  const url = appOrigin()
  await shareLink({
    title: 'Gidira',
    text: 'Find better. Connect faster. Discover trusted businesses on Gidira.',
    url,
    copiedMessage: 'Gidira app link copied.',
  })
}

export async function shareInviteVendor(): Promise<void> {
  const url = `${appOrigin()}/trade#choose-your-plan`
  await shareLink({
    title: 'Join Gidira as a vendor',
    text: 'List your business on Gidira and reach more customers.',
    url,
    copiedMessage: 'Vendor invite link copied.',
  })
}

export async function shareProfileUrl(url: string, label = 'Profile'): Promise<void> {
  await shareLink({
    title: `My Gidira ${label}`,
    text: 'Check out my profile on Gidira.',
    url,
    copiedMessage: 'Profile link copied.',
  })
}
