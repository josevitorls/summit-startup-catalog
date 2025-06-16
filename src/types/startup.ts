
// Types for the Web Summit Rio 2025 Startup Catalog

export interface LogoUrls {
  tinythumb: string;
  tiny: string;
  thumb: string;
  medium: string;
  large: string;
  original: string;
}

export interface ExternalUrls {
  homepage?: string;
  angellist?: string;
  crunchbase?: string;
  instagram?: string;
  twitter?: string;
  facebook?: string;
  linkedin?: string;
  youtube?: string;
  alternative_website?: string;
}

export interface Topic {
  id: string;
  name: string;
  __typename: string;
}

export interface TopicEdge {
  node: Topic;
  __typename: string;
}

export interface TopicConnection {
  edges: TopicEdge[];
  __typename: string;
}

export interface Country {
  id: string;
  name: string;
  __typename: string;
}

export interface Industry {
  id: string;
  name: string;
  __typename: string;
}

export interface Attendee {
  id: string;
  name: string;
  role: string;
  companyName: string;
  jobTitle: string;
  avatarUrl?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  country?: Country;
  industry?: Industry;
  email?: string;
  bio?: string;
  twitterUrl?: string;
  githubUrl?: string;
  facebookUrl?: string;
  __typename: string;
}

export interface AttendeeEdge {
  node: Attendee;
  __typename: string;
}

export interface TeamConnection {
  edges: AttendeeEdge[];
}

export interface Company {
  id: string;
  name: string;
  logoUrl: string;
  countryName: string;
  __typename: string;
}

export interface Exhibitor {
  id: string;
  company: Company;
  team: TeamConnection;
}

export interface Attendance {
  id: string;
  role: string;
  exhibitor: Exhibitor;
  offeringTopics: TopicConnection;
  seekingTopics: TopicConnection;
  talks: any;
  name: string;
  avatarUrl?: string;
  firstName?: string;
  lastName?: string;
  twitterUrl?: string;
  githubUrl?: string;
  facebookUrl?: string;
  jobTitle: string;
  companyName: string;
  city?: string;
  country?: Country;
  industry?: Industry;
  email?: string;
  bio?: string;
  __typename: string;
}

export interface AttendanceData {
  attendance: Attendance;
}

export interface AttendanceId {
  data: AttendanceData;
}

export interface Startup {
  company_id: string;
  fundraising: boolean;
  meet_investors: boolean;
  startup_women_founder: boolean;
  startup_black_founder: boolean;
  startup_indigenous_founder: boolean;
  endorsed_by?: string;
  exhibition_date: string;
  industry: string;
  logo_urls: LogoUrls;
  name: string;
  city: string;
  province: string;
  elevator_pitch: string;
  external_urls: ExternalUrls;
  country: string;
  funding_tier: string;
  attendance_ids: AttendanceId[];
  // Custom fields for our app
  tags?: string[];
  selected?: boolean;
  // Kanban fields
  show_in_kanban?: boolean;
  kanban_column?: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
  companyId: string;
}

export interface AppState {
  startups: Startup[];
  filteredStartups: Startup[];
  selectedStartups: Set<string>;
  tags: string[];
  comments: Comment[];
  filters: FilterState;
  loading: boolean;
  error?: string;
  currentPage: number;
  itemsPerPage: number;
  viewMode: 'cards' | 'list' | 'kanban';
}

export interface FilterState {
  search: string;
  country: string;
  industry: string;
  fundingTier: string;
  fundraising?: boolean;
  meetInvestors?: boolean;
  tags: string[];
  offeringTopics: string[];
  seekingTopics: string[];
}
