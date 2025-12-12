export interface Achievement {
  category: string
  title: string
  place: string
  coeff: string
  kon: string
}

export interface YearAchievements {
  year: number
  achievements: Achievement[]
}

/**
 * Parsuje tekst wejściowy do tablicy YearAchievements
 * @param {string} raw - surowy tekst wejściowy
 */
export function parseAchievementsData(raw: string): YearAchievements[] {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)
  const years: Record<number, Achievement[]> = {}
  for (const line of lines) {
    // Format: "2001 Oddział Lubań Kat A Mistrz 235,77 coeff 20 kon"
    // Struktura: rok, organizacja, Kat, kategoria, tytuł, wartość_coeff, coeff, wartość_kon, kon
    // coeff = wartość przed "coeff", kon = wartość między "coeff" a "kon"
    const match = line.match(/^([0-9]{4})\s+(.+?)\s+Kat\s+([A-Z]+)\s+(.+?)\s+([\d.,]+)\s+coeff\s+([\-\d.,]+)\s+kon/)
    if (match) {
      const [_, yearStr, org, category, title, coeffValue, konValue] = match
      const year = parseInt(yearStr)
      if (!years[year]) years[year] = []
      years[year].push({
        category,
        title: `${org} ${title}`.trim(),
        place: title.trim() || '',
        coeff: coeffValue?.trim() || '-',
        kon: konValue?.trim() || '-',
      })
    } else {
      // Fallback dla formatu bez wartości przed coeff: "2001 Oddział Lubań Kat A Mistrz coeff 20 kon"
      const fallbackMatch = line.match(/^([0-9]{4})\s+(.+?)\s+Kat\s+([A-Z]+)\s+(.+?)\s+coeff\s+([\-\d.,]+)\s+kon\s*([\-\d.,]*)/)
      if (fallbackMatch) {
        const [_, yearStr, org, category, title, konValue] = fallbackMatch
        const year = parseInt(yearStr)
        if (!years[year]) years[year] = []
        years[year].push({
          category,
          title: `${org} ${title}`.trim(),
          place: title.trim() || '',
          coeff: '-',
          kon: konValue?.trim() || '-',
        })
      }
    }
  }
  return Object.entries(years).map(([year, achievements]) => ({
    year: Number(year),
    achievements,
  }))
}
