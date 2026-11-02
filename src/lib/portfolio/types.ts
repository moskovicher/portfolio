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

  // ---------- LAYOUT EDITOR (Admin → Design) ----------
  /** When set (and non-empty), a case study page is built from these blocks
   *  instead of the automatic story layout. Projects without blocks keep the old layout. */
  blocks?: Block[];
  /** Page-wide colors for a block-built page. */
  pageStyle?: PageStyle;
}

// ==========================================
// LAYOUT BLOCKS (for the admin layout editor)
// ==========================================

export interface BlockMedia {
  url: string;
  publicId: string;
  resourceType: 'image' | 'video';
  width?: number;
  height?: number;
}

export interface BlockStyle {
  /** Background color of the block (any CSS color). Empty = transparent. */
  bg?: string;
  /** How the background color is drawn:
   *  box  = a rounded panel inside the content column, like the closing note on Nili (default);
   *  band = a strip across the whole width of the page.
   *  Consecutive blocks with the same box color share one panel. */
  bgShape?: 'box' | 'band';
  /** Text color. Empty = the page's text color. */
  color?: string;
  font?: 'display' | 'body';
  size?: 's' | 'm' | 'l' | 'xl';
  align?: 'start' | 'center' | 'end';
  /** How wide the content runs. */
  width?: 'narrow' | 'wide' | 'full';
  /** Space above and below the block. */
  space?: 'none' | 's' | 'm' | 'l';

  // ---- image display (images and text+image blocks) ----
  /** whole = show the entire image, never cropped (default). crop = fill a fixed shape. */
  mediaFit?: 'whole' | 'crop';
  /** Maximum image height. "screen" keeps the image inside one screen. */
  mediaHeight?: 'auto' | 's' | 'm' | 'l' | 'screen';
  /** Shape used when mediaFit is "crop". "auto" = the first image's own shape. */
  mediaRatio?: 'auto' | '1/1' | '4/3' | '3/4' | '16/9' | '2/3';
  /** Text + image: how much of the row the image takes. */
  imageShare?: 'third' | 'half' | 'twoThirds';

  /** A thin dividing line above / below the block's content (inside the block). */
  lineTop?: boolean;
  lineBottom?: boolean;
}

export type Block =
  | { id: string; type: 'heading'; text: LocalizedText; style?: BlockStyle }
  | { id: string; type: 'text'; text: LocalizedText; style?: BlockStyle }
  | { id: string; type: 'images'; media: BlockMedia[]; columns: 1 | 2 | 3; caption?: LocalizedText; style?: BlockStyle }
  | {
      id: string;
      type: 'textImage';
      text: LocalizedText;
      title?: LocalizedText;
      media?: BlockMedia;
      /** Which side the image sits on (start = right in Hebrew, left in English). */
      imageSide: 'start' | 'end';
      /** Small text under the image. */
      caption?: LocalizedText;
      style?: BlockStyle;
    }
  | {
      id: string;
      type: 'button';
      text: LocalizedText;
      url: string;
      /** solid = filled with the page's accent color; outline = a frame in the text color. */
      variant: 'solid' | 'outline';
      style?: BlockStyle;
    }
  | { id: string; type: 'stats'; items: ProjectStat[]; note?: LocalizedText; style?: BlockStyle }
  | { id: string; type: 'quote'; text: LocalizedText; by?: LocalizedText; style?: BlockStyle }
  | { id: string; type: 'spacer'; style?: BlockStyle }
  | { id: string; type: 'divider'; style?: BlockStyle };

export interface PageStyle {
  bg?: string;
  color?: string;
  accent?: string;
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