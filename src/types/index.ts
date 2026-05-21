// --- Devotional --------------------------------------------------------------
export type DevotionalStatus = 'draft' | 'scheduled' | 'published' | 'cancelled'

export interface Devotional {
  id: string
  title: string
  bible_reference: string
  bible_text: string
  devotional_text: string
  final_prayer: string
  original_audio_url: string | null
  background_music_url: string | null
  mixed_audio_url: string | null
  cover_image_url: string | null
  status: DevotionalStatus
  publish_date: string
  send_notification: boolean
  featured: boolean
  created_at: string
  updated_at: string
  // computed
  reactions_count?: { amen: number; edified: number }
  comments_count?: number
}

// --- Comment -----------------------------------------------------------------
export type CommentStatus = 'pending' | 'approved' | 'hidden'

export interface Comment {
  id: string
  devotional_id: string
  author_name: string
  comment_text: string
  status: CommentStatus
  created_at: string
  approved_at: string | null
}

// --- Reaction ----------------------------------------------------------------
export type ReactionType = 'amen' | 'edified'

export interface Reaction {
  id: string
  devotional_id: string
  reaction_type: ReactionType
  device_id: string
  created_at: string
}

// --- Prayer Request ----------------------------------------------------------
export type PrayerVisibility = 'public' | 'private'
export type PrayerStatus = 'pending' | 'approved' | 'prayed' | 'answered'

export interface PrayerRequest {
  id: string
  author_name: string
  request_text: string
  visibility: PrayerVisibility
  status: PrayerStatus
  created_at: string
}

// --- Announcement ------------------------------------------------------------
export type AnnouncementPriority = 'normal' | 'important' | 'urgent'
export type AnnouncementStatus = 'active' | 'inactive'

export interface Announcement {
  id: string
  title: string
  content: string
  priority: AnnouncementPriority
  status: AnnouncementStatus
  publish_date: string
  created_at: string
}

// --- Push Subscription -------------------------------------------------------
export interface PushSubscriptionRecord {
  id: string
  endpoint: string
  keys_auth: string
  keys_p256dh: string
  user_agent: string
  device_id: string
  created_at: string
  active: boolean
}

// --- Admin User ---------------------------------------------------------------
export interface AdminUser {
  id: string
  username: string
  role: 'super_admin' | 'admin'
  active: boolean
  created_at: string
}

// --- Background Music ---------------------------------------------------------
export interface BackgroundMusic {
  id: string
  name: string
  url: string
  duration_seconds: number
  created_at: string
}

// --- Mixer Settings ----------------------------------------------------------
export interface MixerSettings {
  voiceVolume: number        // 0-1, default 1.0
  musicVolume: number        // 0-1, default 0.15
  fadeInSeconds: number      // default 2
  fadeOutSeconds: number     // default 3
  loopBackground: boolean    // default true
}

// --- Notification Log --------------------------------------------------------
export interface NotificationLog {
  id: string
  devotional_id: string
  total_sent: number
  total_failed: number
  sent_at: string
}

// --- Financial Report --------------------------------------------------------
export type FinancialReportStatus = 'draft' | 'published' | 'hidden'

export interface FinancialReport {
  id: string
  title: string
  description: string | null
  reference_month: number   // 1â12
  reference_year: number
  pdf_url: string
  status: FinancialReportStatus
  created_at: string
  updated_at: string
}

// --- Dashboard Stats ---------------------------------------------------------
export interface DashboardStats {
  devotionalToday: boolean
  totalDevotionals: number
  pendingComments: number
  approvedComments: number
  pushSubscribers: number
  lastNotificationSent: string | null
}

// --- CÃ©lula ------------------------------------------------------------------
export type CelulaPostType = 'comunicado' | 'aviso' | 'pdf_curso' | 'pregacao' | 'interacao'
export type CelulaPostStatus = 'draft' | 'published'

export interface Celula {
  id: string
  slug: string
  name: string
  description: string | null
  cover_image_url: string | null
  leader_name: string | null
  meeting_day: string | null
  meeting_time: string | null
  meeting_location: string | null
  active: boolean
  created_at: string
}

export interface CelulaPost {
  id: string
  celula_id: string
  type: CelulaPostType
  title: string
  content: string | null
  pdf_url: string | null
  video_url: string | null
  audio_url: string | null
  pinned: boolean
  status: CelulaPostStatus
  created_by: string
  created_at: string
  updated_at: string
  // computed
  read_count?: number
  presence_count?: number
  comments_count?: number
  user_read?: boolean
  user_presence?: boolean
}

export interface CelulaComment {
  id: string
  post_id: string
  author_name: string
  comment_text: string
  status: string
  created_at: string
}

export interface CelulaPresenca {
  id: string
  post_id: string
  device_id: string
  author_name: string | null
  created_at: string
}
