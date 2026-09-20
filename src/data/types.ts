/**
 * Domain model for the baby vc radar.
 *
 * NOTE: every record in ./vcs, ./startups, ./news, ./jobs, ./learning and ./events
 * is static demo data assembled for this proof of concept. No scraper runs behind it.
 */

export type Industry =
  | "AI / ML"
  | "Fintech"
  | "Climate"
  | "Health"
  | "SaaS"
  | "Consumer"
  | "Deeptech"
  | "Mobility"
  | "Cyber"
  | "Space";

export type Stage = "Pre-seed" | "Seed" | "Series A" | "Series B" | "Series C+";

export type EntityKind = "vc" | "startup";

export interface Place {
  city: string;
  country: string;
  /** [longitude, latitude] */
  coords: [number, number];
}

export interface Vc {
  id: string;
  kind: "vc";
  name: string;
  place: Place;
  /** Assets under management, human readable. */
  aum: string;
  stages: Stage[];
  focus: Industry[];
  /** Deals closed in the trailing twelve months. */
  dealsTtm: number;
  thesis: string;
  notable: string[];
  site: string;
  /** True if a baby vc alum currently works here. */
  alumniInside: boolean;
}

export interface Startup {
  id: string;
  kind: "startup";
  name: string;
  place: Place;
  industry: Industry;
  stage: Stage;
  founded: number;
  headcount: number;
  /** Headcount growth over the trailing 6 months, as a percentage. */
  growth6m: number;
  raisedTotal: string;
  lastRound: string;
  /** ISO date of the last round. */
  lastRoundDate: string;
  backers: string[];
  blurb: string;
  site: string;
  /** True if a baby vc alum currently works here. */
  alumniInside?: boolean;
}

export type Entity = Vc | Startup;

export interface NewsItem {
  id: string;
  /** ISO date. */
  date: string;
  headline: string;
  summary: string;
  amount: string;
  round: Stage;
  industry: Industry;
  /** Startup id, when the story maps onto a tracked company. */
  startupId?: string;
  startupName: string;
  /** VC ids that led or participated. */
  investorIds: string[];
  investors: string[];
  place: Place;
  source: string;
}

export type JobLevel = "Internship" | "Analyst" | "Associate" | "Mid" | "Senior" | "Leadership";

export interface Job {
  id: string;
  title: string;
  /** Employer id, pointing at a Vc or Startup. */
  employerId: string;
  employerName: string;
  employerKind: EntityKind;
  place: Place;
  remote: boolean;
  level: JobLevel;
  team: string;
  comp: string;
  /** ISO date the listing appeared. */
  posted: string;
  /** Estimated ISO start date in this proof-of-concept dataset. */
  starts?: string;
  /** Flagged in the UI with a "new" marker. */
  isNew: boolean;
  url: string;
}

export type LearningFormat = "Bootcamp" | "Fellowship" | "Course" | "Summer school" | "Accelerator";

export interface Learning {
  id: string;
  name: string;
  host: string;
  format: LearningFormat;
  place: Place;
  /** Human readable window, e.g. "6 weeks, evenings". */
  duration: string;
  /** ISO date the programme starts. */
  starts: string;
  /** ISO date applications close. */
  deadline: string;
  cost: string;
  /** Roughly what share of applicants get in, human readable. */
  selectivity: string;
  focus: "VC" | "Founding" | "Both";
  blurb: string;
  url: string;
  /** Run by baby vc itself. */
  isBabyVc?: boolean;
}

export type EventFormat = "Conference" | "Summit" | "Fair" | "Demo day" | "Meetup";

export interface NetworkEvent {
  id: string;
  name: string;
  format: EventFormat;
  place: Place;
  /** ISO date. */
  starts: string;
  /** ISO date. */
  ends: string;
  attendees: string;
  ticket: string;
  /** Who the room is mostly made of. */
  crowd: string;
  blurb: string;
  url: string;
}
