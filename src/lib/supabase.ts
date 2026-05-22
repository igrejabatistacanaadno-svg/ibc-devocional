import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnon) {
  console.warn(
    '[IBC] Supabase env vars not set. App running in demo/mock mode.',
  )
}

export const supabase = createClient(supabaseUrl ?? 'https://placeholder.supabase.co', supabaseAnon ?? 'placeholder')

// --- Devotionals -------------------------------------------------------------
export const devotionalsApi = {
  getPublished: () =>
    supabase
      .from('devotionals')
      .select('*')
      .eq('status', 'published')
      .lte('publish_date', new Date().toISOString())
      .order('publish_date', { ascending: false }),

  getToday: () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return supabase
      .from('devotionals')
      .select('*')
      .eq('status', 'published')
      .gte('publish_date', today.toISOString())
      .lt('publish_date', tomorrow.toISOString())
      .single()
  },

  getById: (id: string) =>
    supabase.from('devotionals').select('*').eq('id', id).single(),

  getAll: () =>
    supabase.from('devotionals').select('*').order('created_at', { ascending: false }),

  create: (data: Record<string, unknown>) =>
    supabase.from('devotionals').insert(data).select().single(),

  update: (id: string, data: Record<string, unknown>) =>
    supabase.from('devotionals').update(data).eq('id', id).select().single(),

  delete: (id: string) =>
    supabase.from('devotionals').delete().eq('id', id),
}

// --- Comments ----------------------------------------------------------------
export const commentsApi = {
  getApproved: (devotionalId: string) =>
    supabase
      .from('comments')
      .select('*')
      .eq('devotional_id', devotionalId)
      .eq('status', 'approved')
      .order('created_at', { ascending: true }),

  getPending: () =>
    supabase
      .from('comments')
      .select('*, devotionals(title)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),

  create: (data: { devotional_id: string; author_name: string; comment_text: string }) =>
    supabase.from('comments').insert({ ...data, status: 'pending' }).select().single(),

  updateStatus: (id: string, status: string) =>
    supabase.from('comments').update({ status, approved_at: status === 'approved' ? new Date().toISOString() : null }).eq('id', id),

  delete: (id: string) =>
    supabase.from('comments').delete().eq('id', id),
}

// --- Reactions ---------------------------------------------------------------
export const reactionsApi = {
  toggle: (devotionalId: string, reactionType: string, deviceId: string) =>
    supabase.rpc('toggle_reaction', {
      p_devotional_id: devotionalId,
      p_reaction_type: reactionType,
      p_device_id: deviceId,
    }),

  getCounts: (devotionalId: string) =>
    supabase.rpc('get_reaction_counts', { p_devotional_id: devotionalId }),

  getUserReactions: (devotionalId: string, deviceId: string) =>
    supabase
      .from('reactions')
      .select('reaction_type')
      .eq('devotional_id', devotionalId)
      .eq('device_id', deviceId),
}

// --- Prayer Requests ---------------------------------------------------------
export const prayerApi = {
  getPublicApproved: () =>
    supabase
      .from('prayer_requests')
      .select('*')
      .eq('visibility', 'public')
      .eq('status', 'approved')
      .order('created_at', { ascending: false }),

  getAll: () =>
    supabase.from('prayer_requests').select('*').order('created_at', { ascending: false }),

  create: (data: { author_name: string; request_text: string; visibility: string }) =>
    supabase.from('prayer_requests').insert({ ...data, status: 'pending' }).select().single(),

  updateStatus: (id: string, status: string) =>
    supabase.from('prayer_requests').update({ status }).eq('id', id),
}

// --- Announcements ------------------------------------------------------------
export const announcementsApi = {
  getActive: () =>
    supabase
      .from('announcements')
      .select('*')
      .eq('status', 'active')
      .lte('publish_date', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false }),

  getAll: () =>
    supabase.from('announcements').select('*').order('created_at', { ascending: false }),

  create: (data: Record<string, unknown>) =>
    supabase.from('announcements').insert(data).select().single(),

  update: (id: string, data: Record<string, unknown>) =>
    supabase.from('announcements').update(data).eq('id', id),

  delete: (id: string) =>
    supabase.from('announcements').delete().eq('id', id),
}

// --- Push Subscriptions ------------------------------------------------------
export const pushApi = {
  save: (sub: PushSubscriptionJSON, deviceId: string) =>
    supabase.from('push_subscriptions').upsert({
      endpoint: sub.endpoint,
      keys_auth: sub.keys?.auth,
      keys_p256dh: sub.keys?.p256dh,
      user_agent: navigator.userAgent,
      device_id: deviceId,
      active: true,
    }, { onConflict: 'endpoint' }),

  getCount: () =>
    supabase.from('push_subscriptions').select('*', { count: 'exact', head: true }).eq('active', true),

  remove: (endpoint: string) =>
    supabase.from('push_subscriptions').update({ active: false }).eq('endpoint', endpoint),
}

// --- Storage -----------------------------------------------------------------
export const storageApi = {
  uploadAudio: async (file: Blob, path: string) => {
    // Determina o Content-Type correto pelo nome do arquivo (evita bug iOS com audio/webm)
    const _ext = path.split('.').pop()?.toLowerCase() ?? ''
    const _mimeByExt: Record<string, string> = {
      webm: 'audio/webm',
      wav:  'audio/wav',
      mp3:  'audio/mpeg',
      m4a:  'audio/mp4',
      aac:  'audio/aac',
      ogg:  'audio/ogg',
    }
    const contentType =
      (_ext && _mimeByExt[_ext]) ||
      (file.type && file.type !== 'application/octet-stream' ? file.type : 'audio/webm')

    const { data, error } = await supabase.storage
      .from('devotional-audio')
      .upload(path, file, { contentType, upsert: true })
    if (error) throw error
    const { data: urlData } = supabase.storage.from('devotional-audio').getPublicUrl(data.path)
    return urlData.publicUrl
  },

  uploadImage: async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from('devotional-images')
      .upload(path, file, { contentType: file.type, upsert: true })
    if (error) throw error
    const { data: urlData } = supabase.storage.from('devotional-images').getPublicUrl(data.path)
    return urlData.publicUrl
  },

  uploadMusic: async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from('background-music')
      .upload(path, file, { contentType: file.type, upsert: true })
    if (error) throw error
    const { data: urlData } = supabase.storage.from('background-music').getPublicUrl(data.path)
    return urlData.publicUrl
  },

  getMusicLibrary: () =>
    supabase.from('background_music').select('*').order('created_at', { ascending: false }),

  uploadPdf: async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from('financial-reports')
      .upload(path, file, { contentType: 'application/pdf', upsert: true })
    if (error) throw error
    const { data: urlData } = supabase.storage.from('financial-reports').getPublicUrl(data.path)
    return urlData.publicUrl
  },

  deletePdf: async (path: string) => {
    const { error } = await supabase.storage.from('financial-reports').remove([path])
    if (error) throw error
  },
}

// --- Financial Reports -------------------------------------------------------
export const financialReportsApi = {
  getPublished: () =>
    supabase
      .from('financial_reports')
      .select('*')
      .eq('status', 'published')
      .order('reference_year', { ascending: false })
      .order('reference_month', { ascending: false }),

  getAll: () =>
    supabase
      .from('financial_reports')
      .select('*')
      .order('reference_year', { ascending: false })
      .order('reference_month', { ascending: false }),

  create: (data: Record<string, unknown>) =>
    supabase.from('financial_reports').insert(data).select().single(),

  update: (id: string, data: Record<string, unknown>) =>
    supabase.from('financial_reports').update(data).eq('id', id).select().single(),

  delete: (id: string) =>
    supabase.from('financial_reports').delete().eq('id', id),
}

// --- Dashboard Stats ---------------------------------------------------------
export const dashboardApi = {
  getStats: () => supabase.rpc('get_dashboard_stats'),
}

// --- Células -----------------------------------------------------------------
export const celulasApi = {
  getAll: () =>
    supabase.from('celulas').select('*').eq('active', true).order('name'),

  getBySlug: (slug: string) =>
    supabase.from('celulas').select('*').eq('slug', slug).single(),

  update: (id: string, data: Record<string, unknown>) =>
    supabase.from('celulas').update(data).eq('id', id).select().single(),
}

export const celulaPostsApi = {
  getPublished: (celulaId: string) =>
    supabase
      .from('celula_posts')
      .select('*')
      .eq('celula_id', celulaId)
      .eq('status', 'published')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false }),

  getAll: (celulaId: string) =>
    supabase
      .from('celula_posts')
      .select('*')
      .eq('celula_id', celulaId)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false }),

  getById: (id: string) =>
    supabase.from('celula_posts').select('*').eq('id', id).single(),

  create: (data: Record<string, unknown>) =>
    supabase.from('celula_posts').insert(data).select().single(),

  update: (id: string, data: Record<string, unknown>) =>
    supabase.from('celula_posts').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).select().single(),

  delete: (id: string) =>
    supabase.from('celula_posts').delete().eq('id', id),
}

export const celulaInteracoesApi = {
  // Confirmação de leitura
  markRead: (postId: string, deviceId: string) =>
    supabase
      .from('celula_leituras')
      .upsert({ post_id: postId, device_id: deviceId }, { onConflict: 'post_id,device_id' }),

  getReadCount: (postId: string) =>
    supabase
      .from('celula_leituras')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId),

  userRead: (postId: string, deviceId: string) =>
    supabase
      .from('celula_leituras')
      .select('id')
      .eq('post_id', postId)
      .eq('device_id', deviceId)
      .maybeSingle(),

  // Confirmação de presença
  confirmPresence: (postId: string, deviceId: string, authorName: string) =>
    supabase
      .from('celula_presencas')
      .upsert({ post_id: postId, device_id: deviceId, author_name: authorName }, { onConflict: 'post_id,device_id' }),

  getPresences: (postId: string) =>
    supabase
      .from('celula_presencas')
      .select('*')
      .eq('post_id', postId)
      .order('created_at'),

  userPresence: (postId: string, deviceId: string) =>
    supabase
      .from('celula_presencas')
      .select('id')
      .eq('post_id', postId)
      .eq('device_id', deviceId)
      .maybeSingle(),

  // Comentários/Interações
  getComments: (postId: string) =>
    supabase
      .from('celula_comments')
      .select('*')
      .eq('post_id', postId)
      .eq('status', 'approved')
      .order('created_at'),

  addComment: (data: { post_id: string; author_name: string; comment_text: string }) =>
    supabase
      .from('celula_comments')
      .insert({ ...data, status: 'approved' })
      .select()
      .single(),

  deleteComment: (id: string) =>
    supabase.from('celula_comments').delete().eq('id', id),

  getAllCommentsByPost: (postId: string) =>
    supabase
      .from('celula_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at'),
}

// --- Cursos / Materiais ------------------------------------------------------
export const cursosApi = {
  getPublished: () =>
    supabase
      .from('cursos')
      .select('*')
      .eq('status', 'published')
      .lte('publish_date', new Date().toISOString())
      .order('publish_date', { ascending: false }),

  getByCategory: (category: string) =>
    supabase
      .from('cursos')
      .select('*')
      .eq('status', 'published')
      .eq('category', category)
      .lte('publish_date', new Date().toISOString())
      .order('publish_date', { ascending: false }),

  getAll: () =>
    supabase.from('cursos').select('*').order('created_at', { ascending: false }),

  getById: (id: string) =>
    supabase.from('cursos').select('*').eq('id', id).single(),

  create: (data: Record<string, unknown>) =>
    supabase.from('cursos').insert(data).select().single(),

  update: (id: string, data: Record<string, unknown>) =>
    supabase
      .from('cursos')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single(),

  delete: (id: string) =>
    supabase.from('cursos').delete().eq('id', id),
}

export const cursosPdfsApi = {
  uploadPdf: async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from('cursos-pdfs')
      .upload(path, file, { contentType: 'application/pdf', upsert: true })
    if (error) throw error
    const { data: urlData } = supabase.storage.from('cursos-pdfs').getPublicUrl(data.path)
    return urlData.publicUrl
  },

  uploadCover: async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from('cursos-pdfs')
      .upload(path, file, { contentType: file.type, upsert: true })
    if (error) throw error
    const { data: urlData } = supabase.storage.from('cursos-pdfs').getPublicUrl(data.path)
    return urlData.publicUrl
  },

  deletePath: async (path: string) => {
    const { error } = await supabase.storage.from('cursos-pdfs').remove([path])
    if (error) throw error
  },
}

export const celulaMaterialsApi = {
  uploadPdf: async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from('celula-materiais')
      .upload(path, file, { contentType: file.type, upsert: true })
    if (error) throw error
    const { data: urlData } = supabase.storage.from('celula-materiais').getPublicUrl(data.path)
    return urlData.publicUrl
  },

  uploadCover: async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from('celula-materiais')
      .upload(path, file, { contentType: file.type, upsert: true })
    if (error) throw error
    const { data: urlData } = supabase.storage.from('celula-materiais').getPublicUrl(data.path)
    return urlData.publicUrl
  },

  deletePath: async (path: string) => {
    const { error } = await supabase.storage.from('celula-materiais').remove([path])
    if (error) throw error
  },
}
