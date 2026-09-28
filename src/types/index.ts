export type MailleType = 'dispersee' | 'resserree' | 'dense'

export type PinCategory =
  | 'maison'
  | 'travail'
  | 'ecole'
  | 'commerce'
  | 'sante'
  | 'loisir'
  | 'nature'
  | 'autre'
  | 'collectif'

export interface Pin {
  id: string
  type: PinCategory
  label: string
  lat: number
  lng: number
  manque_key?: string
}

export type CompetenceType = 'penseur' | 'faiseur' | 'relieur' | 'conteur' | 'gardien'

export interface ManqueOption {
  key: string
  label: string
  description: string
  icon: string
}

export interface CompetenceDescription {
  type: CompetenceType
  label: string
  description: string
  icon: string
  examples: string[]
}

export interface MatchResult {
  user_id: string
  display_name: string | null
  distance_bucket: string
  primary_type: CompetenceType | null
  manque_keys: string[] | null
  share_name: boolean
  share_manques: boolean
  share_type: boolean
  share_email: boolean
  email: string | null
}

export interface CollectifResult {
  collectif_id: string
  nom: string
  description: string | null
  contact: string | null
  distance_label: string
  manque_keys: string[]
  membre_count: number
  matches_manques: boolean
}

export interface EchangeItem {
  id: string
  user_id: string
  direction: 'offre' | 'demande'
  description: string
  manque_key: string | null
  actif: boolean
  created_at: string
}

export interface NearbyEchangeItem {
  id: string
  user_id: string
  direction: 'offre' | 'demande'
  description: string
  manque_key: string | null
  distance_label: string
  display_name: string | null
}

export interface UserProfile {
  maille: {
    pins: Pin[]
    maille_type: MailleType | null
    center_lat: number | null
    center_lng: number | null
    radius_km: number | null
  }
  manques: {
    manque_keys: string[]
    notes: string
  }
  competences: {
    primary_type: CompetenceType | null
    secondary_type: CompetenceType | null
    skills_free: string[]
    learning_intent: string
  }
  compagnons: {
    name: string
    notes: string
  }[]
  visibility: {
    is_visible: boolean
    share_name: boolean
    share_manques: boolean
    share_type: boolean
  }
}
