export function createEmptyOtpDigits(length: number): string[] {
  return Array.from({ length }, () => "")
}

export function applyOtpInputAtIndex(
  prev: string[],
  index: number,
  rawValue: string,
  length: number,
): { next: string[]; focusIndex: number } {
  const digits = rawValue.replace(/\D/g, "");

  if (!digits) {
    const next = [...prev];
    next[index] = "";
    return { next, focusIndex: index };
  }

  if (digits.length > 1) {
    const next = [...prev];
    for (let i = 0; i < digits.length && index + i < length; i += 1) {
      next[index + i] = digits[i] ?? "";
    }
    return { next, focusIndex: Math.min(index + digits.length, length - 1) };
  }

  const next = [...prev];
  next[index] = digits;
  return {
    next,
    focusIndex: index < length - 1 ? index + 1 : index,
  };
}

export function applyOtpPasteAtIndex(
  prev: string[],
  index: number,
  pastedText: string,
  length: number,
): { next: string[]; focusIndex: number } {
  const digits = pastedText.replace(/\D/g, "");
  if (!digits) {
    return { next: prev, focusIndex: index };
  }

  const next = [...prev];
  for (let i = 0; i < digits.length && index + i < length; i += 1) {
    next[index + i] = digits[i] ?? "";
  }

  return { next, focusIndex: Math.min(index + digits.length, length - 1) };
}
