import Link from 'next/link'

export default function ParcoursIntro() {
  return (
    <main className="min-h-screen bg-terre-50">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link href="/" className="text-mousse-600 hover:underline text-sm">← Accueil</Link>

        <div className="mt-10 mb-12">
          <h1 className="text-3xl font-serif text-terre-800 mb-4">Le parcours</h1>
          <p className="text-terre-600 leading-relaxed text-lg">
            Ce parcours en quatre étapes t'aide à trouver le fil que tu peux tirer.
            Pas à ta place - mais avec les bonnes questions, dans le bon ordre.
          </p>
        </div>

        <div className="space-y-4 mb-12">
          {[
            {
              href: '/parcours/1-maille',
              num: '01',
              title: 'Où es-tu vraiment ?',
              time: '10 min',
              text: 'Cartographie tes lieux quotidiens sur une vraie carte et découvre la forme de ta maille.',
            },
            {
              href: '/parcours/2-manques',
              num: '02',
              title: 'Qu\'est-ce qui te manque ?',
              time: '5 min',
              text: 'Nomme les communs absents dans ta vie - ceux qu\'aucun achat ne remplacera.',
            },
            {
              href: '/parcours/3-competences',
              num: '03',
              title: 'Que sais-tu faire ?',
              time: '5 min',
              text: 'Identifie ton art parmi les cinq types de tisseurs du commun.',
            },
            {
              href: '/parcours/4-compagnons',
              num: '04',
              title: 'Avec qui ?',
              time: '5 min',
              text: 'Nomme tes compagnons, et découvre d\'autres personnes dans ta maille.',
            },
          ].map(step => (
            <Link
              key={step.num}
              href={step.href}
              className="block bg-white rounded-xl border border-terre-200 hover:border-mousse-300 hover:shadow-sm p-5 transition-all group"
            >
              <div className="flex items-start gap-4">
                <span className="text-2xl font-serif text-terre-300 font-light shrink-0 group-hover:text-mousse-400 transition-colors">
                  {step.num}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="font-serif text-terre-800 text-lg">{step.title}</h2>
                    <span className="text-terre-400 text-xs shrink-0 ml-4">{step.time}</span>
                  </div>
                  <p className="text-terre-500 text-sm leading-relaxed">{step.text}</p>
                </div>
                <span className="text-terre-300 group-hover:text-mousse-400 transition-colors shrink-0">→</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="bg-terre-100 rounded-xl p-5 text-sm text-terre-600 leading-relaxed">
          <p>
            <strong className="text-terre-700">Tu peux faire les étapes dans l'ordre ou les prendre séparément.</strong>{' '}
            Tes réponses sont sauvegardées automatiquement si tu es connecté·e.
            La synthèse finale croise tes quatre cartes et te propose des pistes - et des personnes proches.
          </p>
        </div>
      </div>
    </main>
  )
}
