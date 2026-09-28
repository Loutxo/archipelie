import type { ManqueOption, CompetenceDescription, PinCategory } from '@/types'

export const PIN_CATEGORIES: { type: PinCategory; label: string; color: string; icon: string }[] = [
  { type: 'maison',   label: 'Domicile',       color: '#a87c54', icon: '🏠' },
  { type: 'travail',  label: 'Travail / études', color: '#548540', icon: '💼' },
  { type: 'ecole',    label: 'École / garderie', color: '#3284ad', icon: '🏫' },
  { type: 'commerce', label: 'Commerce quotidien', color: '#c57c2e', icon: '🛒' },
  { type: 'sante',    label: 'Santé',           color: '#c0395a', icon: '⚕️' },
  { type: 'loisir',   label: 'Loisir / culture', color: '#7b4eab', icon: '🎭' },
  { type: 'nature',   label: 'Nature / parc',   color: '#2e8b57', icon: '🌿' },
  { type: 'autre',    label: 'Autre lieu régulier', color: '#666', icon: '📍' },
  { type: 'collectif', label: 'Collectif / initiative', color: '#0891b2', icon: '🏘️' },
]

export const MANQUES: ManqueOption[] = [
  {
    key: 'alimentation',
    label: 'Une alimentation locale et partagée',
    description: 'GASAP, coopérative alimentaire, marché de producteurs de proximité',
    icon: '🌾',
  },
  {
    key: 'reparation',
    label: 'Un lieu pour réparer',
    description: 'Repair café, atelier partagé, ressourcerie',
    icon: '🔧',
  },
  {
    key: 'jardin',
    label: 'Un sol pour cultiver',
    description: 'Jardin collectif, compost partagé, verger communautaire',
    icon: '🌱',
  },
  {
    key: 'energie',
    label: 'Une énergie gérée en commun',
    description: 'Coopérative énergétique, panneaux solaires collectifs',
    icon: '☀️',
  },
  {
    key: 'voisinage',
    label: 'Un voisinage qui se parle',
    description: 'Assemblée de quartier, fête des voisins régulière, groupe de voisinage',
    icon: '👋',
  },
  {
    key: 'culture',
    label: 'Un lieu de culture et de débat',
    description: 'Cinéma associatif, bibliothèque vivante, café-philo, salle commune',
    icon: '📚',
  },
  {
    key: 'mobilite',
    label: 'Une mobilité douce et partagée',
    description: 'Vélos en commun, covoiturage local, espaces de mobilité douce',
    icon: '🚲',
  },
  {
    key: 'monnaie',
    label: 'Une monnaie locale ou circuit court',
    description: 'Monnaie de proximité, SEL (Système d\'Échange Local), épargne solidaire',
    icon: '🪙',
  },
  {
    key: 'soin',
    label: 'Des espaces de soin et d\'entraide',
    description: 'Réseau de soutien mutuel, crèche parentale, maison médicale coopérative',
    icon: '🤝',
  },
  {
    key: 'enfants',
    label: 'Un meilleur accueil pour les enfants',
    description: 'Rue apaisée, école à taille humaine, activités extrascolaires collectives',
    icon: '🧒',
  },
  {
    key: 'decision',
    label: 'Un espace de décision collective',
    description: 'Assemblée délibérative, budget participatif, conseil de quartier',
    icon: '🗳️',
  },
  {
    key: 'semences',
    label: 'Un patrimoine de savoirs partagés',
    description: 'Grainothèque, partage de savoir-faire, bibliothèque d\'outils',
    icon: '🌰',
  },
]

export const COMPETENCES: CompetenceDescription[] = [
  {
    type: 'penseur',
    label: 'Le·la Penseur·se',
    description: 'Tu cartographies, analyses, nommes les limites et les possibles. Tu lis, tu relies les idées, tu donnes un cadre à ce qui semble chaotique.',
    icon: '🗺️',
    examples: ['Rédiger un diagnostic territorial', 'Identifier les points de levier', 'Articuler une vision cohérente', 'Comprendre les systèmes complexes'],
  },
  {
    type: 'faiseur',
    label: 'Le·la Faiseur·se',
    description: 'Tu construis, cultives, répares, fabriques. Tes mains savent faire ce que les mots ne peuvent pas. Tu transforms les idées en réalités tangibles.',
    icon: '🛠️',
    examples: ['Aménager un espace partagé', 'Cultiver un jardin collectif', 'Construire des infrastructures communes', 'Maîtriser un savoir-faire artisanal'],
  },
  {
    type: 'relieur',
    label: 'Le·la Relieur·se',
    description: 'Tu animes, écoutes, désamorces les conflits, tisses les liens entre les personnes. Tu rends possible la coopération là où elle ne se ferait pas seule.',
    icon: '🕸️',
    examples: ['Faciliter des réunions', 'Médier des conflits', 'Accueillir les nouveaux', 'Maintenir la cohésion d\'un groupe'],
  },
  {
    type: 'conteur',
    label: 'Le·la Conteur·se',
    description: 'Tu racontes, convaincs, rends la bascule désirable. Tu sais trouver les mots, les images, les histoires qui donnent envie de rejoindre et d\'agir.',
    icon: '✍️',
    examples: ['Écrire des textes qui mobilisent', 'Faire des vidéos ou podcasts', 'Tenir des réseaux sociaux', 'Organiser des événements inspirants'],
  },
  {
    type: 'gardien',
    label: 'Le·la Gardien·ne',
    description: 'Tu protèges, veilles, tiens la ligne dans la durée. Tu empêches le monde de se défaire et tu te bats pour ce qui vit encore, même quand personne ne regarde.',
    icon: '🛡️',
    examples: ['Défendre juridiquement des communs', 'Maintenir des pratiques dans le temps', 'S\'opposer aux décisions néfastes', 'Préserver des ressources ou des espèces'],
  },
]

// Advice library: keyed by maille_type
export const MAILLE_ADVICE: Record<string, { title: string; text: string; actions: string[] }> = {
  dispersee: {
    title: 'Ta maille est dispersée aux quatre vents',
    text: 'Tes lieux de vie sont éparpillés - c\'est le résultat d\'infrastructures conçues pour fragmenter. Ta première tâche n\'est pas de trouver un projet, c\'est de reconcentrer ta géographie. Choisis délibérément de ramener certains de tes ancrages quotidiens dans un périmètre plus resserré. Un commerçant de quartier plutôt qu\'une grande surface lointaine. Une école de proximité. Un lieu régulier à pied. Ces décisions semblent banales ; elles sont fondatrices.',
    actions: [
      'Repérer un ou deux commerces de quartier que tu pourrais privilégier',
      'Identifier un café ou une bibliothèque proche où tu pourrais travailler parfois',
      'Cartographier les services existants dans un rayon de 15 min à pied',
    ],
  },
  resserree: {
    title: 'Ta maille est resserrée mais encore clairsemée',
    text: 'Tes lieux sont proches géographiquement - c\'est déjà beaucoup. Ce qui te manque, ce n\'est pas la proximité physique, c\'est la densité des liens. Des gens vivent près de toi sans que vous vous parliez vraiment. Ta tâche est de densifier : transformer des voisins en connaissances, des connaissances en compagnons. Ça commence par des gestes très simples - une conversation dans la rue, une porte qu\'on tient, un prénom qu\'on retient.',
    actions: [
      'Mémoriser le prénom de trois voisins que tu ne connais pas encore',
      'Trouver un lieu où tu vas régulièrement et où tu pourrais engager une conversation',
      'Organiser un petit repas avec deux ou trois personnes de ton quartier',
    ],
  },
  dense: {
    title: 'Ta maille est resserrée et vivante',
    text: 'Tu as une géographie dense et des ancrages multiples dans un périmètre cohérent. C\'est une richesse rare. Ta tâche n\'est pas de construire, mais de renforcer et d\'approfondir ce qui tient déjà. Les liens que tu as, as-tu vraiment pris le temps de les cultiver ? Les projets qui t\'entourent, as-tu commencé à t\'y impliquer ? Parfois la première pierre à poser est la plus simple : s\'engager vraiment dans quelque chose qui existe déjà.',
    actions: [
      'Identifier une initiative existante dans ta maille et t\'y impliquer activement',
      'Proposer d\'animer ou de co-organiser quelque chose',
      'Introduire deux personnes de ton réseau qui ne se connaissent pas encore',
    ],
  },
}

export const SKILL_CATEGORIES: { label: string; icon: string; skills: string[] }[] = [
  {
    label: 'Terre & alimentation',
    icon: '🌾',
    skills: [
      'Cultiver un potager',
      'Greffer et tailler des arbres',
      'Conduire des ruches',
      'Tenir un poulailler',
      'Cuisiner pour beaucoup',
      'Conserver (lactofermentation, bocaux, séchage)',
      'Faire son pain au levain',
      'Coordonner un GASAP',
      'Tisser le lien avec des fermes',
    ],
  },
  {
    label: 'Eau',
    icon: '💧',
    skills: [
      'Récupérer et stocker l\'eau de pluie',
      'Creuser une noue',
      'Gérer une mare',
      'Phytoépuration',
      'Cartographier sources et ruisseaux',
    ],
  },
  {
    label: 'Énergie',
    icon: '⚡',
    skills: [
      'Poser et entretenir du photovoltaïque',
      'Lire une installation électrique',
      'Isoler en biosourcé (paille, chanvre, ouate)',
      'Dimensionner une installation énergétique',
      'Monter une communauté d\'énergie',
    ],
  },
  {
    label: 'Habitat, foncier & construction',
    icon: '🏗️',
    skills: [
      'Maçonner',
      'Charpenter',
      'Menuiser',
      'Enduire à la terre ou à la chaux',
      'Rénover en matériaux locaux',
      'Lire un bail, négocier avec une commune',
      'Monter une régie ou un CLT',
    ],
  },
  {
    label: 'Mobilité & espace public',
    icon: '🚲',
    skills: [
      'Réparer vélos et vélos-cargos',
      'Organiser une flotte partagée',
      'Organiser du covoiturage',
      'Végétaliser une rue',
      'Dessiner un aménagement',
      'Obtenir une autorisation d\'occupation',
    ],
  },
  {
    label: 'Réparation, maintenance & low-tech',
    icon: '🔧',
    skills: [
      'Réparer électroménager et électronique',
      'Réparer outils et machines',
      'Coudre et raccommoder',
      'Affûter, souder',
      'Travailler le bois et le métal',
      'Animer un repair-café',
      'Documenter un geste pour le transmettre',
    ],
  },
  {
    label: 'Monnaie, échange & gestion',
    icon: '🪙',
    skills: [
      'Tenir une comptabilité',
      'Bâtir un budget, gérer une trésorerie',
      'Lancer une monnaie locale ou un SEL',
      'Chercher des financements',
      'Rédiger une demande de subvention',
      'Manier le droit associatif',
    ],
  },
  {
    label: 'Soin & lien',
    icon: '🤝',
    skills: [
      'Accompagner les aînés ou les malades',
      'Garder des enfants',
      'Accueillir et héberger',
      'Veiller sur les isolés',
      'Donner les premiers secours',
      'Connaître les plantes médicinales',
    ],
  },
  {
    label: 'Transmission & enfance',
    icon: '📖',
    skills: [
      'Enseigner, expliquer, vulgariser',
      'Transmettre un métier ou un geste',
      'Transmettre une langue',
      'Faire classe dehors',
      'Animer des ateliers pour enfants',
    ],
  },
  {
    label: 'Gouvernance, médiation & animation',
    icon: '🗳️',
    skills: [
      'Conduire une réunion',
      'Faciliter une décision (consensus, sociocratie)',
      'Médier un conflit',
      'Structurer un collectif',
      'Écrire des statuts',
      'Tenir la mémoire d\'un groupe',
    ],
  },
  {
    label: 'Récit, art & imaginaire',
    icon: '✍️',
    skills: [
      'Écrire et raconter',
      'Tourner des vidéos ou podcasts',
      'Tenir une lettre ou un site',
      'Photographier et filmer',
      'Dessiner, peindre une fresque',
      'Jouer de la musique',
      'Mettre en scène, organiser une fête',
    ],
  },
  {
    label: 'Vigilance, droit & défense',
    icon: '🛡️',
    skills: [
      'Connaître le droit de l\'urbanisme et de l\'environnement',
      'Déposer un recours',
      'Enquêter, documenter une atteinte',
      'Alerter et mobiliser',
      'Tenir une ligne dans la durée',
    ],
  },
]

export const COMPETENCE_ADVICE: Record<string, { title: string; text: string }> = {
  penseur: {
    title: 'En tant que penseur·se',
    text: 'Ton rôle est de cartographier ce que les autres voient confusément. Mais attention au piège : le penseur sans le faiseur n\'aligne que des utopies de papier. Cherche un·e faiseur·se ou un·e relieur·se à qui remettre tes analyses pour qu\'elles prennent corps. Tu n\'as pas à tout faire - tu as à penser juste, et à transmettre.',
  },
  faiseur: {
    title: 'En tant que faiseur·se',
    text: 'Ta force est concrète, tangible, irremplaçable. Mais le faiseur sans le gardien bâtit moins vite que le système ne détruit. Assure-toi que ce que tu construis est protégé dans la durée - juridiquement, institutionnellement, humainement. Et trouve un·e conteur·se pour raconter ce que tu fais : ça reste invisible sinon.',
  },
  relieur: {
    title: 'En tant que relieur·se',
    text: 'Tu es la colonne vertébrale de tout groupe qui fonctionne - sans toi, les tensions durcissent et les gens s\'en vont. Mais prends soin de toi : le relieur s\'épuise à absorber ce que les autres n\'arrivent pas à résoudre. Pose des limites. Et rappelle-toi que ton art est aussi politique : relier des gens qui ne se seraient pas rencontrés seuls est un acte de transformation sociale.',
  },
  conteur: {
    title: 'En tant que conteur·se',
    text: 'Sans toi, les beaux projets restent invisibles et les gens ne viennent pas. Mais le conteur sans ancrage dans le réel produit de la communication creuse. Assure-toi de rester connecté·e à ce qui se passe vraiment - va voir les faiseurs, écoute les relieur·ses, raconte ce qui est vrai plutôt que ce qui est beau.',
  },
  gardien: {
    title: 'En tant que gardien·ne',
    text: 'Tu portes quelque chose que la plupart des gens ne voient pas : la mémoire de ce qui a failli disparaître, et la vigilance qui empêche que ça recommence. C\'est épuisant, et souvent ingrat. Cherche une communauté qui comprend ce que tu fais - et permets-toi de transmettre : le gardien qui ne forme pas de successeur finit par épuiser seul ce qu\'il préservait.',
  },
}
