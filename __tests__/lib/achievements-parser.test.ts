import { parseAchievementsData } from '../../lib/achievements-parser'

describe('parseAchievementsData', () => {
  it('parses single achievement line', () => {
    const raw = '2001 Oddział Lubań Kat A Mistrz 235,77 coeff 20 kon'
    const result = parseAchievementsData(raw)
    expect(result).toHaveLength(1)
    expect(result[0].year).toBe(2001)
    expect(result[0].achievements[0].category).toBe('A')
    expect(result[0].achievements[0].title).toContain('Oddział Lubań')
    expect(result[0].achievements[0].coeff).toBe('235,77')
    expect(result[0].achievements[0].kon).toBe('20')
  })

  it('parses multiple years and achievements', () => {
    const raw = `2001 Oddział Lubań Kat A Mistrz 235,77 coeff 20 kon\n2002 Oddział Lubań Kat B I Wicemistrz 503,62 coeff 16 kon`
    const result = parseAchievementsData(raw)
    expect(result).toHaveLength(2)
    expect(result[1].year).toBe(2002)
    expect(result[1].achievements[0].category).toBe('B')
    expect(result[1].achievements[0].kon).toBe('16')
  })

  it('handles missing coeff and kon gracefully', () => {
    const raw = '2003 Oddział Lubań Kat GMO Mistrz - coeff - kon'
    const result = parseAchievementsData(raw)
    expect(result[0].achievements[0].coeff).toBe('-')
    expect(result[0].achievements[0].kon).toBe('-')
  })
})
