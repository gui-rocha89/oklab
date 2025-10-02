// Conteúdo centralizado da homepage - Fonte: OK_Lab_SaaS_-_Plano_Executivo_Completo.pdf

export const nav = {
  links: [
    { label: 'Produto', href: '#produto' },
    { label: 'Soluções', href: '#solucoes' },
    { label: 'Preços', href: '#precos' },
    { label: 'Recursos', href: '#recursos' },
  ],
  ctas: [
    { label: 'Entrar', href: '/auth', variant: 'ghost' as const },
    { label: 'Teste grátis', href: '/auth', variant: 'default' as const },
  ],
};

export const hero = {
  headline: 'Sua central de aprovação para vídeos, roteiros e social.',
  subcopy: 'Marque no frame, comente nos roteiros e aprove posts no mesmo painel. Em reais e com suporte em português.',
  ctas: [
    { label: 'Teste grátis 14 dias', href: '/auth', variant: 'default' as const },
    { label: 'Ver planos', href: '#precos', variant: 'outline' as const },
  ],
};

export const howItWorks = {
  title: 'Como funciona',
  subtitle: 'Aprovação de conteúdo simplificada em 4 passos',
  steps: [
    {
      title: 'Envie seu conteúdo',
      description: 'Upload de vídeos ou cole link direto do Vimeo e YouTube',
      image: '/mkt/steps-upload.png',
    },
    {
      title: 'Marque no frame',
      description: 'Desenhe e aponte diretamente no momento exato do vídeo',
      image: '/mkt/steps-mark.png',
    },
    {
      title: 'Comente e aprove',
      description: 'Adicione comentários com timestamp para revisão precisa',
      image: '/mkt/steps-comment.png',
    },
    {
      title: 'Gerencie versões',
      description: 'Histórico completo de todas as revisões e aprovações',
      image: '/mkt/steps-versions.png',
    },
  ],
};

export const features = [
  {
    id: 'video',
    title: 'Vídeo com marcação no frame',
    description: 'Aprovação audiovisual com precisão cirúrgica',
    image: '/mkt/feature-video.png',
    bullets: [
      'Desenhe diretamente sobre o frame do vídeo',
      'Comentários sincronizados com o timecode',
      'Suporte para múltiplos formatos de vídeo',
      'Player HTML5 responsivo e otimizado',
      'Histórico completo de anotações por versão',
    ],
  },
  {
    id: 'briefings',
    title: 'Briefings e Roteiros',
    description: 'Organize suas ideias antes da produção',
    image: '/mkt/feature-briefings.png',
    bullets: [
      'Templates personalizáveis de briefing',
      'Gestão de roteiros com versionamento',
      'Aprovação de conceitos e ideias',
      'Anexos e referências visuais',
      'Compartilhamento com clientes e equipe',
    ],
  },
  {
    id: 'social',
    title: 'Social Media',
    description: 'Planejamento visual de posts e carrosséis',
    image: '/mkt/feature-social.png',
    bullets: [
      'Preview de posts para Instagram e Facebook',
      'Carrosséis com múltiplas imagens',
      'Aprovação de copys e hashtags',
      'Calendário editorial integrado',
      'Export direto para redes sociais',
    ],
  },
];

export const differentials = {
  title: 'Por que OK Lab?',
  items: [
    {
      title: 'Preços em reais',
      description: 'Planos em BRL com cobrança transparente, sem surpresas cambiais',
    },
    {
      title: 'Suporte em português',
      description: 'Time de suporte dedicado falando sua língua, no seu fuso horário',
    },
    {
      title: 'Plataforma unificada',
      description: 'Vídeo, briefings e social media em um só lugar. Menos ferramentas, mais produtividade',
    },
    {
      title: 'Add-ons flexíveis',
      description: 'Escale sua operação sob demanda com add-ons personalizados',
    },
  ],
};

// Planos conforme PDF (5 planos exatos)
export const plans = [
  {
    id: 'social',
    name: 'Social',
    price: 79,
    period: '/mês',
    description: 'Para criadores de conteúdo e pequenas marcas',
    cta: 'Começar',
    ctaHref: '/auth',
    featured: false,
    features: [
      '5 projetos ativos',
      '10GB de armazenamento',
      '1 usuário',
      'Aprovação de posts e carrosséis',
      'Calendário editorial básico',
      'Suporte por email',
    ],
  },
  {
    id: 'filmmaker',
    name: 'Filmmaker',
    price: 129,
    period: '/mês',
    description: 'Para produtoras e videomakers independentes',
    cta: 'Começar',
    ctaHref: '/auth',
    featured: false,
    features: [
      '10 projetos ativos',
      '50GB de armazenamento',
      '2 usuários',
      'Aprovação audiovisual com marcação no frame',
      'Histórico de versões',
      'Comentários e anotações',
      'Suporte prioritário',
    ],
  },
  {
    id: 'creative-pro',
    name: 'Creative Pro',
    price: 149,
    period: '/mês',
    description: 'Para agências criativas e equipes de marketing',
    cta: 'Começar',
    ctaHref: '/auth',
    featured: true,
    features: [
      '20 projetos ativos',
      '100GB de armazenamento',
      '5 usuários',
      'Aprovação audiovisual + social media',
      'Briefings e roteiros',
      'Gestão de clientes',
      'Relatórios básicos',
      'Integração via API',
      'Suporte prioritário',
    ],
  },
  {
    id: 'agency-complete',
    name: 'Agency Complete',
    price: 299,
    period: '/mês',
    description: 'Para agências full-service e produtoras de grande porte',
    cta: 'Começar',
    ctaHref: '/auth',
    featured: false,
    features: [
      '50 projetos ativos',
      '500GB de armazenamento',
      '15 usuários',
      'Todos os recursos do Creative Pro',
      'White-label opcional',
      'Relatórios avançados e analytics',
      'Múltiplas marcas/clientes',
      'Gestão avançada de permissões',
      'Suporte dedicado via WhatsApp',
      'Onboarding personalizado',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    period: '',
    description: 'Para grandes corporações e holdings',
    cta: 'Fale com vendas',
    ctaHref: '/auth?mode=contact',
    featured: false,
    features: [
      'Projetos ilimitados',
      'Armazenamento customizado',
      'Usuários ilimitados',
      'Todos os recursos do Agency Complete',
      'SLA garantido',
      'Infraestrutura dedicada',
      'SSO e integrações enterprise',
      'Success manager dedicado',
      'Treinamento on-site',
      'Contrato customizado',
    ],
  },
];

// Add-ons por plano conforme PDF
export const addons = {
  social: [
    { name: '+5 projetos', price: 15 },
    { name: '+5GB armazenamento', price: 10 },
    { name: '+1 usuário', price: 20 },
    { name: 'Relatórios básicos', price: 25 },
  ],
  filmmaker: [
    { name: '+10 projetos', price: 30 },
    { name: '+20GB armazenamento', price: 20 },
    { name: '+2 usuários', price: 35 },
    { name: 'Aprovação social media', price: 30 },
    { name: 'Briefings e roteiros', price: 25 },
  ],
  'creative-pro': [
    { name: '+20 projetos', price: 50 },
    { name: '+50GB armazenamento', price: 35 },
    { name: '+5 usuários', price: 60 },
    { name: 'White-label', price: 100 },
    { name: 'Relatórios avançados', price: 80 },
  ],
  'agency-complete': [
    { name: '+50 projetos', price: 100 },
    { name: '+200GB armazenamento', price: 80 },
    { name: '+10 usuários', price: 120 },
    { name: 'Infraestrutura dedicada', price: 300 },
  ],
  enterprise: [
    { name: 'Customizado', price: null },
  ],
};

export const logos = {
  title: 'Confiado por equipes criativas de ponta',
  items: [
    { name: 'Cliente 1', image: '/mkt/logo-placeholder.png' },
    { name: 'Cliente 2', image: '/mkt/logo-placeholder.png' },
    { name: 'Cliente 3', image: '/mkt/logo-placeholder.png' },
    { name: 'Cliente 4', image: '/mkt/logo-placeholder.png' },
    { name: 'Cliente 5', image: '/mkt/logo-placeholder.png' },
    { name: 'Cliente 6', image: '/mkt/logo-placeholder.png' },
  ],
};

export const faq = {
  title: 'Perguntas frequentes',
  items: [
    {
      question: 'Como funciona o período de teste gratuito?',
      answer: 'Você tem 14 dias para testar todos os recursos do plano escolhido sem compromisso. Não pedimos cartão de crédito no cadastro.',
    },
    {
      question: 'Posso mudar de plano a qualquer momento?',
      answer: 'Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. As alterações são aplicadas no próximo ciclo de cobrança.',
    },
    {
      question: 'Como funcionam os add-ons?',
      answer: 'Add-ons são recursos extras que você pode contratar sob demanda para expandir seu plano. São cobrados mensalmente junto com a assinatura.',
    },
    {
      question: 'Vocês oferecem desconto para pagamento anual?',
      answer: 'Sim! Pagamentos anuais têm 20% de desconto. Entre em contato com nosso time comercial para mais detalhes.',
    },
    {
      question: 'Qual o formato de vídeo suportado?',
      answer: 'Suportamos MP4, MOV, AVI, MKV e WebM. O sistema converte automaticamente para o formato otimizado para web.',
    },
    {
      question: 'Os dados ficam armazenados onde?',
      answer: 'Todos os dados são armazenados em servidores seguros com backup diário. Utilizamos infraestrutura de nuvem tier-1 com conformidade LGPD.',
    },
  ],
};

export const footer = {
  company: {
    name: 'OK Lab',
    tagline: 'Plataforma de Aprovação de Conteúdos',
  },
  sections: [
    {
      title: 'Produto',
      links: [
        { label: 'Recursos', href: '#recursos' },
        { label: 'Preços', href: '#precos' },
        { label: 'Integrações', href: '#' },
        { label: 'Atualizações', href: '#' },
      ],
    },
    {
      title: 'Soluções',
      links: [
        { label: 'Agências', href: '#' },
        { label: 'Produtoras', href: '#' },
        { label: 'Marcas', href: '#' },
        { label: 'Creators', href: '#' },
      ],
    },
    {
      title: 'Empresa',
      links: [
        { label: 'Sobre', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'Carreiras', href: '#' },
        { label: 'Contato', href: '#' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Termos de Uso', href: '#' },
        { label: 'Privacidade', href: '#' },
        { label: 'LGPD', href: '#' },
      ],
    },
  ],
  social: [
    { name: 'Instagram', href: '#', icon: 'Instagram' },
    { name: 'LinkedIn', href: '#', icon: 'Linkedin' },
    { name: 'Twitter', href: '#', icon: 'Twitter' },
  ],
  copyright: '© 2025 OK Lab. Todos os direitos reservados.',
};
