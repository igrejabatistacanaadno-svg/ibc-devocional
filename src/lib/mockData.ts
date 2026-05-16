/**
 * Dados de exemplo para uso quando o Supabase não estiver configurado.
 * Remove este arquivo após conectar o banco de dados real.
 */
import type { Devotional, Announcement, PrayerRequest, Comment } from '@/types'

export const MOCK_DEVOTIONALS: Devotional[] = [
  {
    id: '1',
    title: 'Confiança em Deus para um novo dia',
    bible_reference: 'Salmo 37:5',
    bible_text: 'Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará.',
    devotional_text:
      'Todos os dias somos convidados a entregar nossas preocupações ao Senhor. A fé não elimina os desafios, mas nos ensina a caminhar com confiança, sabendo que Deus cuida de cada detalhe. Quando entregamos nosso caminho a Ele, não estamos desistindo do controle por fraqueza, mas exercendo a maior forma de força: a confiança em quem é soberano sobre todas as coisas. Hoje, ao levantar, escolha entregar. Entregue os planos, os medos, as incertezas. E confie que o mesmo Deus que sustenta o universo está atento a cada passo seu.',
    final_prayer:
      'Senhor, guia o nosso dia, fortalece a nossa fé e ajuda-nos a confiar plenamente em Ti. Que cada desafio seja uma oportunidade de ver a Tua glória. Em nome de Jesus, amém.',
    original_audio_url: null,
    background_music_url: null,
    mixed_audio_url: null,
    cover_image_url: null,
    status: 'published',
    publish_date: new Date().toISOString(),
    send_notification: false,
    featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    reactions_count: { amen: 24, edified: 17 },
    comments_count: 5,
  },
  {
    id: '2',
    title: 'A paz que excede todo entendimento',
    bible_reference: 'Filipenses 4:7',
    bible_text:
      'E a paz de Deus, que excede todo o entendimento, guardará os vossos corações e os vossos pensamentos em Cristo Jesus.',
    devotional_text:
      'Há momentos em que nossa mente humana não consegue explicar por que sentimos paz em meio ao caos. É a paz sobrenatural de Deus atuando em nossos corações. Ela não depende das circunstâncias, não precisa de lógica para existir. É simplesmente a presença de Cristo guardando nossa alma.',
    final_prayer:
      'Pai, que a Tua paz que excede todo entendimento venha habitar em nosso coração agora. Que ela seja como uma sentinela que guarda nossos pensamentos. Amém.',
    original_audio_url: null,
    background_music_url: null,
    mixed_audio_url: null,
    cover_image_url: null,
    status: 'published',
    publish_date: new Date(Date.now() - 86400000).toISOString(),
    send_notification: false,
    featured: false,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    reactions_count: { amen: 31, edified: 22 },
    comments_count: 8,
  },
  {
    id: '3',
    title: 'Força renovada a cada manhã',
    bible_reference: 'Lamentações 3:22-23',
    bible_text:
      'As misericórdias do Senhor são a causa de não sermos consumidos, porque as suas misericórdias não têm fim. Renovam-se cada manhã; grande é a tua fidelidade.',
    devotional_text:
      'A misericórdia de Deus não se esgota. A cada amanhecer, ela se renova. Isso significa que não importa o que aconteceu ontem — a fidelidade de Deus é nova hoje. Você tem uma nova oportunidade de recomeçar, de crescer, de se aproximar dEle.',
    final_prayer:
      'Obrigado, Senhor, pela misericórdia renovada a cada manhã. Que este dia seja vivido à luz da Tua fidelidade. Amém.',
    original_audio_url: null,
    background_music_url: null,
    mixed_audio_url: null,
    cover_image_url: null,
    status: 'published',
    publish_date: new Date(Date.now() - 172800000).toISOString(),
    send_notification: false,
    featured: false,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
    reactions_count: { amen: 19, edified: 14 },
    comments_count: 3,
  },
]

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: '1',
    title: 'Culto de Oração',
    content: 'Hoje teremos culto de oração às 19h30. Participe conosco. Sua presença fortalece a comunidade!',
    priority: 'important',
    status: 'active',
    publish_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Escola Bíblica Dominical',
    content: 'Neste domingo nossa EBD terá o tema "Família segundo a Palavra de Deus". Convide sua família!',
    priority: 'normal',
    status: 'active',
    publish_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
]

export const MOCK_PRAYER_REQUESTS: PrayerRequest[] = [
  {
    id: '1',
    author_name: 'Maria Silva',
    request_text: 'Peço oração pela minha família, que estamos passando por um momento difícil. Que Deus nos guie.',
    visibility: 'public',
    status: 'approved',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '2',
    author_name: 'João Santos',
    request_text: 'Oração pela saúde da minha mãe que está hospitalizada. Confiamos na cura de Deus.',
    visibility: 'public',
    status: 'approved',
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
]

export const MOCK_COMMENTS: Comment[] = [
  {
    id: '1',
    devotional_id: '1',
    author_name: 'Ana Paula',
    comment_text: 'Que palavra abençoada! Exatamente o que eu precisava ouvir hoje. Graças a Deus!',
    status: 'approved',
    created_at: new Date(Date.now() - 1800000).toISOString(),
    approved_at: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: '2',
    devotional_id: '1',
    author_name: 'Carlos Eduardo',
    comment_text: 'Amém! Deus tem sido fiel em cada momento. Obrigado pastor pela dedicação.',
    status: 'approved',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    approved_at: new Date(Date.now() - 3600000).toISOString(),
  },
]
