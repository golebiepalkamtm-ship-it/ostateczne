import type { YearData, DivisionResults, AchievementLevel } from './types';

/**
 * Parse raw achievement data into structured format
 */
export function parseAchievementData(raw: string): YearData[] {
  const years: YearData[] = [];
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  
  let currentYear: YearData | null = null;
  let currentDivision: DivisionResults | null = null;
  
  for (const line of lines) {
    // Detect year (4 digits on separate line)
    const yearMatch = line.match(/^(\d{4})$/);
    if (yearMatch) {
      if (currentYear) years.push(currentYear);
      currentYear = {
        year: parseInt(yearMatch[1]),
        divisions: [],
        masteryScore: 0,
        totalMasterTitles: 0,
      };
      continue;
    }
    
    if (!currentYear) continue;
    
    // Detect division level
    const divMatch = line.match(/^(Oddział|Okręg|Region V|MP)\s+(.+)$/);
    if (divMatch) {
      if (currentDivision) currentYear.divisions.push(currentDivision);
      currentDivision = {
        level: divMatch[1] as AchievementLevel,
        divisionName: divMatch[2],
        results: [],
      };
      continue;
    }
    
    // Parse category result - flexible regex for various formats
    if (!line.startsWith('Kat ')) continue;
    
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    
    const category = line.substring(0, colonIndex).trim();
    const rest = line.substring(colonIndex + 1).trim();
    
    if (!currentDivision) continue;
    
    // Extract title (everything before first comma or note)
    let title = rest;
    let coefficient: number | null = null;
    let concourses: number | null = null;
    let note: string | undefined;
    
    // Extract note if present
    const noteMatch = rest.match(/\(([^)]+)\)/);
    if (noteMatch) {
      note = noteMatch[1].trim();
      title = rest.substring(0, rest.indexOf('(')).trim();
    }
    
    // Extract coefficient (look for "X coeff" or "X% coeff")
    const coeffMatch = rest.match(/([\d.]+)\s*%?\s*coeff/);
    if (coeffMatch) {
      coefficient = parseFloat(coeffMatch[1]);
      // Remove coeff part from title if it's there
      title = title.replace(/,?\s*[\d.]+\s*%?\s*coeff,?/g, '').trim();
    } else if (rest.includes('- coeff')) {
      coefficient = null;
    }
    
    // Extract concourses
    const conMatch = rest.match(/(\d+)\s*con/);
    if (conMatch) {
      concourses = parseInt(conMatch[1]);
      title = title.replace(/,?\s*\d+\s*con,?/g, '').trim();
    } else if (rest.includes('- con')) {
      concourses = null;
    }
    
    // Clean up title - remove trailing commas and extra spaces
    title = title.replace(/^,\s*|\s*,$/g, '').trim();
    
    // Check for master title (case insensitive, exclude wicemistrz)
    if (title.toLowerCase().includes('mistrz') && !title.toLowerCase().includes('wicemistrz')) {
      currentYear.totalMasterTitles++;
    }
    
    currentDivision.results.push({
      category,
      title,
      coefficient,
      concourses,
      note,
    });
  }
  
  // Push last division and year
  if (currentDivision && currentYear) currentYear.divisions.push(currentDivision);
  if (currentYear) years.push(currentYear);
  
  // Calculate mastery scores (0-100 based on master titles ratio)
  years.forEach(year => {
    const totalResults = year.divisions.reduce((sum, d) => sum + d.results.length, 0);
    year.masteryScore = totalResults > 0 
      ? Math.min(100, (year.totalMasterTitles / totalResults) * 200) 
      : 0;
  });
  
  return years;
}

