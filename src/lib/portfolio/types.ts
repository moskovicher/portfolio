export type Locale = "en" | "he";

export interface LocalizedText {
  en: string;
  he: string;
}

// ==========================================
// ARTWORK TYPES (for gallery artworks)
// ==========================================

export interface ArtworkImage {
  url: string;
  publicId?: string;
}

export interface Artwork {
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  dimensions?: LocalizedText;
  materials?: LocalizedText;
  year?: number;
  images: ArtworkImage[];
  video?: string;
  cloudinaryTag?: string;
  cloudinaryFolder?: string;
  imageOrder?: string;
  isPublished?: boolean;
  mainImageIndex?: number; // Index of featured image for gallery thumbnail
  mainImageUrl?: string;   // Actual URL of the chosen gallery thumbnail
  accent?: string;
}

// ==========================================
// PROJECT TYPES (for portfolio projects)
// ==========================================

export interface ProjectMeta {
  slug: string;
  folder: string;
  year: number;
  featured: boolean;
  accent: string;
  videoUrl?: string;
  image: string;
  title: LocalizedText;
  subtitle?: LocalizedText;
  award?: LocalizedText;
  description: LocalizedText;
  role?: LocalizedText;
  tools?: string[];
  externalUrl?: string;
  cloudinaryTag?: string;
  imageOrder?: string;
  isPublished?: boolean;
  /** How the project's gallery renders. Defaults to "grid" when unset. */
  displayMode?: 'grid' | 'carousel';
  /**
   * Ordered, comma-separated Cloudinary publicIds to display for this project.
   * When set, ONLY these images show, in this order (overrides imageOrder).
   * When empty/unset, every image carrying the tag is shown (ordered by imageOrder).
   */
  selectedImages?: string;

  // ---------- CASE STUDY (Work page) ----------
  /** When true, the project is one of the main case studies on the Work page
   *  and its page uses the story layout. Otherwise it lives under Illustration. */
  caseStudy?: boolean;
  /** Comma-separated tags shown under the title, e.g. "מיתוג, עיצוב סיכה". */
  tags?: LocalizedText;
  /** Up to 3 big numbers, e.g. { value: "173", label: { he: "הגשות", en: "submissions" } } */
  stats?: ProjectStat[];
  /** One sentence shown under the numbers. */
  statsNote?: LocalizedText;
  /** Closing note at the end of the page (e.g. a personal story). */
  closingTitle?: LocalizedText;
  closingText?: LocalizedText;
  /** Comma-separated publicIds shown at half width (two consecutive halves sit side by side). */
  halfImages?: string;
  /** Comma-separated publicIds shown at a third of the width (up to three in a row). */
  thirdImages?: string;
  /** Text on the external link button, e.g. "See it at Piece of History". Falls back to "View live". */
  externalLabel?: LocalizedText;
}

export interface ProjectStat {
  value: string;
  label: LocalizedText;
}

// ==========================================
// COMMISSION TYPES (for portfolio/commissions sub-works)
// ==========================================

export interface Commission {
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  year?: number;
  accent?: string;
  image?: string;           // preview image URL (card thumbnail)
  cloudinaryTag?: string;   // tag whose images form the gallery
  imageOrder?: string;
  mainImageIndex?: number;  // which gallery image is the card preview
  isPublished?: boolean;
}

// ==========================================
// SHOP PRODUCT TYPES
// ==========================================

export interface ShopProduct {
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  price?: string;           // display string, e.g. "₪120" or "$40"
  available?: boolean;      // in stock / orderable
  accent?: string;
  image?: string;           // card preview image URL
  cloudinaryTag?: string;   // tag whose images form the product gallery
  imageOrder?: string;
  mainImageUrl?: string;
  isPublished?: boolean;
}