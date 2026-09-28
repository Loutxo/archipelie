import Link from 'next/link'
import Image from 'next/image'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import SignOutButton from '@/components/SignOutButton'

async function getUser() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch {
    return null
  }
}

export default async function LandingPage() {
  const user = await getUser()

  return (
    <main className="min-h-screen bg-terre-50">
      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
        <Image
          src="/tomorrode-icon.png"
          alt="TomorRode"
          width={56}
          height={59}
          className="mx-auto mb-3 opacity-90"
        />
        <p className="text-mousse-600 text-sm font-medium tracking-widest uppercase mb-4">
          Archipélie
        </p>
        <h1 className="text-4xl md:text-5xl font-serif text-terre-800 leading-tight mb-6">
          Par où, toi, tu commenceras ?
        </h1>
        <p className="text-lg text-terre-600 leading-relaxed mb-10 max-w-xl mx-auto">
          Un parcours en quatre étapes pour cartographier ta géographie réelle,
          nommer tes manques, situer tes capacités, et trouver tes compagnons.
        </p>

        {user ? (
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/parcours"
              className="inline-block bg-mousse-600 hover:bg-mousse-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition-colors"
            >
              Continuer mon parcours →
            </Link>
            <Link
              href="/synthese"
              className="inline-block border border-terre-300 hover:border-terre-400 text-terre-700 px-8 py-4 rounded-lg font-medium text-lg transition-colors"
            >
              Voir ma synthèse
            </Link>
            <SignOutButton />
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="inline-block bg-mousse-600 hover:bg-mousse-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition-colors"
            >
              Commencer le parcours
            </Link>
            <Link
              href="/auth/login"
              className="inline-block border border-terre-300 hover:border-terre-400 text-terre-700 px-8 py-4 rounded-lg font-medium text-lg transition-colors"
            >
              Se connecter
            </Link>
          </div>
        )}
      </section>

      {/* The four steps */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              num: '01',
              title: 'Où es-tu vraiment ?',
              text: 'Place tes lieux quotidiens sur une carte. Découvre si ta maille est dispersée, resserrée ou dense - et ce que cela implique.',
              color: 'bg-terre-100 border-terre-200',
            },
            {
              num: '02',
              title: 'Qu\'est-ce qui te manque ?',
              text: 'Nomme les communs absents dans ta maille - ceux qu\'aucun achat ne peut remplacer. Découvre si d\'autres vivent le même manque.',
              color: 'bg-mousse-50 border-mousse-200',
            },
            {
              num: '03',
              title: 'Que sais-tu faire ?',
              text: 'Identifie ton art parmi les cinq types de tisseurs. Chacun est indispensable. Lequel es-tu ?',
              color: 'bg-eau-50 border-eau-200',
            },
            {
              num: '04',
              title: 'Avec qui ?',
              text: 'Nomme tes compagnons potentiels. Puis découvre d\'autres personnes dans ta géographie avec des manques et des envies proches.',
              color: 'bg-terre-100 border-terre-200',
            },
          ].map(step => (
            <div key={step.num} className={`rounded-xl border p-6 ${step.color}`}>
              <span className="text-3xl font-serif text-terre-400 font-light">{step.num}</span>
              <h2 className="text-xl font-serif text-terre-800 mt-2 mb-3">{step.title}</h2>
              <p className="text-terre-600 leading-relaxed">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quote */}
      <section className="bg-terre-800 text-terre-100 py-16 px-6">
        <blockquote className="max-w-2xl mx-auto text-center">
          <p className="text-xl font-serif leading-relaxed italic mb-4">
            «&nbsp;Prends une carte, et trace dessus les lieux où tu vas dans la semaine,
            les seuils où tu t'arrêtes, les gens que tu y rencontres.
            Ce dessin te dira déjà beaucoup.&nbsp;»
          </p>
          <footer className="text-terre-400 text-sm">- Epilogue -</footer>
        </blockquote>
      </section>

      {/* Footer */}
      <footer className="text-center py-10 text-terre-400 text-sm">
        <p className="mb-4">Archipélie - né du livre <em>TomorRode : L'acouphène et l'aurore</em></p>
        <a
          href="https://tomorrode.be"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block opacity-70 hover:opacity-100 transition-opacity"
        >
          <Image
            src="/tomorrode-logo-horizontal.png"
            alt="TomorRode"
            width={140}
            height={46}
          />
        </a>
      </footer>
    </main>
  )
}
