
import { Startup } from '../types/startup';

const JSON_FILES = [
  'processed_batch_0-99.json',
  'processed_batch_100-199.json',
  'processed_batch_200-299.json',
  'processed_batch_300-399.json',
  'processed_batch_400-499.json',
  'processed_batch_500-599.json',
  'processed_batch_600-699.json',
  'processed_batch_700-799.json',
  'processed_batch_800-899.json',
  'processed_batch_900-999.json',
  'processed_batch_1000-1099.json',
  'processed_batch_1100-1199.json',
  'processed_batch_1200-1277.json',
];

export async function loadAllStartups(): Promise<Startup[]> {
  const allStartups: Startup[] = [];
  
  for (const fileName of JSON_FILES) {
    try {
      const response = await fetch(`/${fileName}`);
      if (!response.ok) {
        console.warn(`Failed to load ${fileName}: ${response.statusText}`);
        continue;
      }
      
      const data = await response.json();
      
      // Handle both array and object formats
      const startups = Array.isArray(data) ? data : Object.values(data);
      
      allStartups.push(...startups as Startup[]);
    } catch (error) {
      console.error(`Error loading ${fileName}:`, error);
    }
  }
  
  console.log(`Loaded ${allStartups.length} startups from ${JSON_FILES.length} files`);
  return allStartups;
}

export function normalizeStartupData(startups: Startup[]): Startup[] {
  return startups.map(startup => ({
    ...startup,
    tags: startup.tags || [],
    selected: false,
    // Ensure required fields have defaults
    funding_tier: startup.funding_tier || 'Not specified',
    elevator_pitch: startup.elevator_pitch || '',
    external_urls: startup.external_urls || {},
  }));
}

export function searchStartups(startups: Startup[], searchTerm: string): Startup[] {
  if (!searchTerm.trim()) return startups;
  
  const term = searchTerm.toLowerCase();
  
  return startups.filter(startup => {
    // Search in company name
    if (startup.name.toLowerCase().includes(term)) return true;
    
    // Search in elevator pitch
    if (startup.elevator_pitch.toLowerCase().includes(term)) return true;
    
    // Search in team members
    const hasMatchingMember = startup.attendance_ids.some(attendance => {
      const team = attendance.data.attendance.exhibitor.team.edges;
      return team.some(member => 
        member.node.name.toLowerCase().includes(term) ||
        member.node.jobTitle.toLowerCase().includes(term)
      );
    });
    
    if (hasMatchingMember) return true;
    
    // Search in topics
    const hasMatchingTopic = startup.attendance_ids.some(attendance => {
      const offering = attendance.data.attendance.offeringTopics.edges;
      const seeking = attendance.data.attendance.seekingTopics.edges;
      
      return [...offering, ...seeking].some(topic => 
        topic.node.name.toLowerCase().includes(term)
      );
    });
    
    return hasMatchingTopic;
  });
}

export function getUniqueValues(startups: Startup[], field: keyof Startup): string[] {
  const values = startups.map(startup => startup[field] as string).filter(Boolean);
  return [...new Set(values)].sort();
}

export function getUniqueTopics(startups: Startup[], type: 'offering' | 'seeking' = 'offering'): string[] {
  const topics = new Set<string>();
  
  startups.forEach(startup => {
    startup.attendance_ids.forEach(attendance => {
      const topicConnection = type === 'offering' 
        ? attendance.data.attendance.offeringTopics 
        : attendance.data.attendance.seekingTopics;
      
      topicConnection.edges.forEach(edge => {
        topics.add(edge.node.name);
      });
    });
  });
  
  return [...topics].sort();
}
