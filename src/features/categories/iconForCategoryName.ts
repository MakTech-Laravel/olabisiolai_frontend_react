/** Map API category name to a Lucide icon export name (see `CategoryCard`). */
export function lucideIconForCategoryName(name: string): string {
  const n = name.toLowerCase()

  const rules: [string, string][] = [
    ['plumb', 'Wrench'],
    ['electric', 'Zap'],
    ['cater', 'UtensilsCrossed'],
    ['food', 'UtensilsCrossed'],
    ['restaurant', 'UtensilsCrossed'],
    ['clean', 'Sparkles'],
    ['construct', 'HardHat'],
    ['beauty', 'Scissors'],
    ['spa', 'Scissors'],
    ['salon', 'Scissors'],
    ['photo', 'Camera'],
    ['logistic', 'Truck'],
    ['transport', 'Truck'],
    ['tutor', 'GraduationCap'],
    ['education', 'GraduationCap'],
    ['legal', 'Scale'],
    ['law', 'Scale'],
    ['account', 'Calculator'],
    ['auto', 'Car'],
    ['vehicle', 'Car'],
    ['laundry', 'Shirt'],
    ['security', 'Shield'],
    ['market', 'Megaphone'],
    ['retail', 'ShoppingBag'],
    ['tech', 'Cpu'],
    ['software', 'Code'],
    ['health', 'HeartPulse'],
    ['wellness', 'HeartPulse'],
    ['real estate', 'Building2'],
    ['property', 'Building2'],
  ]

  for (const [needle, icon] of rules) {
    if (n.includes(needle)) return icon
  }

  return 'LayoutGrid'
}
