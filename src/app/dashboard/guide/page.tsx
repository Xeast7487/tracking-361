import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

const toc = [
  { id: 'intro',      label: 'Introduction' },
  { id: 'section-1', label: '1. Qui nous sommes' },
  { id: 'section-2', label: '2. Ce qui guide notre travail' },
  { id: 'section-3', label: '3. Notre méthode de travail' },
  { id: 'section-4', label: '4. Communication dans l\'équipe' },
  { id: 'section-5', label: '5. Projets, priorités et échéances' },
  { id: 'section-6', label: '6. Relation avec les clients' },
  { id: 'section-7', label: '7. Création, révisions et approbations' },
]

export default async function GuidePage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="max-w-5xl mx-auto pb-4">

      {/* En-tête */}
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-2">
          Document interne · Agence 361°
        </p>
        <h1 className="text-3xl font-bold text-white">Guide de l'employé</h1>
        <p className="text-slate-400 mt-2 max-w-xl leading-relaxed">
          Notre façon de travailler, nos attentes communes et les réflexes qui nous aident à bien collaborer.
        </p>
      </div>

      <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-10 lg:items-start">

        {/* Table des matières */}
        <aside>
          {/* Mobile : repliable */}
          <details className="lg:hidden card mb-8 group">
            <summary className="px-4 py-3 font-semibold text-white cursor-pointer select-none flex items-center justify-between">
              <span>Table des matières</span>
              <span className="text-slate-400 transition-transform group-open:rotate-180">▾</span>
            </summary>
            <nav className="px-4 pb-4 border-t border-slate-700/50 pt-3">
              <ol className="space-y-1">
                {toc.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="text-sm text-slate-400 hover:text-blue-400 transition-colors block py-0.5"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </details>

          {/* Bureau : fixe */}
          <nav className="hidden lg:block card p-5 sticky top-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
              Table des matières
            </p>
            <ol className="space-y-1.5">
              {toc.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="text-sm text-slate-400 hover:text-blue-400 transition-colors block leading-snug"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        {/* Contenu principal */}
        <article className="space-y-12 min-w-0">

          {/* Introduction */}
          <section id="intro" className="scroll-mt-6">
            <div className="p-6 rounded-xl bg-gradient-to-br from-blue-950/50 to-slate-800/40 border border-blue-800/30">
              <h2 className="text-xl font-bold text-white mb-3">Bienvenue chez Agence 361°!</h2>
              <div className="space-y-3 text-slate-300 leading-relaxed">
                <p>
                  Ce guide rassemble notre façon de travailler, les attentes que nous partageons et les réflexes
                  qui nous aident à bien collaborer. Il s'adresse autant aux nouvelles personnes dans l'équipe
                  qu'à celles qui souhaitent retrouver rapidement une information.
                </p>
                <p>
                  Nous voulons que chacun sache comment avancer dans son travail, à qui s'adresser lorsqu'une
                  question se présente et ce que nous attendons les uns des autres. Si une situation particulière
                  n'est pas abordée ici, on en discute directement.
                </p>
              </div>
            </div>
          </section>

          {/* Section 1 */}
          <section id="section-1" className="scroll-mt-6">
            <SectionHeading number="1" title="Qui nous sommes" />
            <div className="space-y-3 text-slate-300 leading-relaxed mt-5">
              <p>
                Agence 361° est une agence créative et marketing basée à Sherbrooke. Nous accompagnons des
                entreprises dans leur stratégie, leur image de marque, leur site web, leur contenu, leur
                publicité et leur présence numérique.
              </p>
              <p>
                Notre nom représente l'idée d'aller{' '}
                <strong className="text-white font-semibold">un degré plus loin</strong>. Ce « +1 » n'est
                pas nécessairement quelque chose de spectaculaire. C'est parfois poser une meilleure question,
                remarquer un détail important, proposer une solution plus adaptée ou prendre le temps de
                comprendre la réalité d'un client avant de créer.
              </p>
              <p>
                Nous travaillons à échelle humaine, en collaboration directe avec les gens derrière les
                entreprises que nous accompagnons. Chaque client a sa personnalité, ses objectifs et ses
                contraintes. Notre rôle est de créer une solution qui lui ressemble, plutôt que d'appliquer
                le même style ou la même recette à tous.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section id="section-2" className="scroll-mt-6">
            <SectionHeading number="2" title="Ce qui guide notre travail" />
            <div className="space-y-8 mt-5">

              <div>
                <SubHeading>Comprendre avant de produire</SubHeading>
                <div className="space-y-3 text-slate-300 leading-relaxed">
                  <p>
                    Avant de concevoir un visuel, de rédiger un texte, de développer une fonctionnalité ou de
                    lancer une campagne, nous cherchons à comprendre le besoin réel.
                  </p>
                  <p>
                    À qui s'adresse le travail? Quel problème cherche-t-on à résoudre? Quel résultat attend-on?
                    Qu'est-ce qui a déjà été décidé ou approuvé?
                  </p>
                  <p>
                    Si le mandat manque de clarté, pose des questions. Prendre quelques minutes pour clarifier
                    une demande peut éviter plusieurs heures de travail dans la mauvaise direction.
                  </p>
                </div>
              </div>

              <div>
                <SubHeading>Faire preuve d'initiative</SubHeading>
                <div className="space-y-3 text-slate-300 leading-relaxed">
                  <p>
                    Nous encourageons chacun à proposer des idées et à signaler ce qu'il remarque. Si tu vois
                    une occasion d'améliorer un projet, un processus ou l'expérience d'un client, fais-en part
                    à l'équipe.
                  </p>
                  <p>
                    L'initiative va aussi de pair avec le jugement. Avant de modifier une orientation approuvée,
                    de promettre quelque chose à un client ou d'ajouter du travail à un mandat, valide la
                    décision avec la personne responsable du projet.
                  </p>
                </div>
              </div>

              <div>
                <SubHeading>Collaborer entre expertises</SubHeading>
                <div className="space-y-3 text-slate-300 leading-relaxed">
                  <p>
                    Stratégie, direction artistique, design, rédaction, photo, vidéo, développement et publicité
                    se nourrissent mutuellement. Une décision prise dans un domaine peut avoir un effet sur le
                    travail des autres.
                  </p>
                  <p>
                    Partage l'information utile avec les personnes concernées. Invite les bonnes personnes dans
                    une discussion lorsqu'une décision touche leur expertise. Personne n'a à tout savoir, mais
                    chacun doit pouvoir soulever un enjeu qu'il remarque.
                  </p>
                </div>
              </div>

              <div>
                <SubHeading>Livrer un travail solide</SubHeading>
                <div className="space-y-3 text-slate-300 leading-relaxed">
                  <p>
                    Un livrable est prêt lorsqu'il répond au mandat, qu'il a été vérifié et qu'une autre personne
                    peut le comprendre ou l'utiliser sans devoir deviner ce qui manque.
                  </p>
                  <p>
                    Avant de remettre ton travail, vérifie ce qui s'applique : textes, informations factuelles,
                    formats, dimensions, liens, fichiers, versions, fonctionnement et consignes du client.
                  </p>
                </div>
              </div>

            </div>
          </section>

          {/* Section 3 */}
          <section id="section-3" className="scroll-mt-6">
            <SectionHeading number="3" title="Notre méthode de travail" />
            <p className="text-slate-300 leading-relaxed mt-5 mb-6">
              Notre approche se construit autour de quatre étapes. Elles nous aident à garder une direction
              claire, mais nous les adaptons à la réalité de chaque mandat.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <StepCard step="1" label="Diagnostiquer">
                Nous prenons le temps de comprendre le contexte, les objectifs, les audiences, les données
                disponibles, la situation actuelle et les priorités. Le but est d'identifier ce qui mérite
                d'être clarifié, ajusté ou renforcé.
              </StepCard>
              <StepCard step="2" label="Créer">
                Nous donnons forme à une direction adaptée au mandat : positionnement, identité, messages,
                contenu, design ou expérience numérique. Le travail doit être cohérent, distinctif et fidèle
                à la marque du client.
              </StepCard>
              <StepCard step="3" label="Déployer">
                Nous passons à l'exécution : production, développement, mise en ligne, campagnes, intégrations
                et diffusion. Nous vérifions que le travail fonctionne dans son contexte réel.
              </StepCard>
              <StepCard step="4" label="Mesurer et optimiser">
                Une fois le travail en place, nous observons les résultats, analysons les usages et ajustons
                ce qui doit l'être. Les données servent à comprendre et à prendre de meilleures décisions.
              </StepCard>
            </div>
          </section>

          {/* Section 4 */}
          <section id="section-4" className="scroll-mt-6">
            <SectionHeading number="4" title="Communication dans l'équipe" />
            <p className="text-slate-300 leading-relaxed mt-5 mb-5">
              Une bonne communication permet à chacun de travailler avec autonomie sans laisser les autres
              dans le flou.
            </p>
            <ul className="space-y-3 mb-5">
              {[
                "Informe rapidement les personnes concernées lorsqu'une priorité, une échéance ou une décision change.",
                "Signale un blocage dès qu'il apparaît, surtout s'il peut avoir un effet sur une livraison ou sur le travail d'un collègue.",
                "Lorsque tu fais un suivi, précise ce qui est terminé, ce qui reste à faire et ce qui attend une réponse.",
                "Lorsque tu confies une tâche, donne le contexte, le résultat attendu, l'échéance et les liens vers les bons fichiers.",
                "Si plusieurs décisions sont prises verbalement, résume les éléments importants par écrit dans l'espace de travail du projet.",
              ].map((item, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 text-xs flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  <span className="text-slate-300 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-slate-300 leading-relaxed">
              Nous privilégions les échanges directs, respectueux et constructifs. Il est normal de ne pas
              toujours être d'accord sur une idée. On peut défendre son point de vue avec des arguments tout
              en restant ouvert à celui des autres.
            </p>
          </section>

          {/* Section 5 */}
          <section id="section-5" className="scroll-mt-6">
            <SectionHeading number="5" title="Projets, priorités et échéances" />
            <div className="space-y-3 text-slate-300 leading-relaxed mt-5">
              <p>
                Avant de commencer une tâche, assure-toi de comprendre ce qui doit être livré, la date à
                laquelle le travail est nécessaire, les éléments déjà approuvés et la personne responsable
                de la décision finale.
              </p>
              <p>
                Lorsqu'une nouvelle demande s'ajoute, évalue son effet sur tes autres tâches. Si tu crois
                qu'une échéance ne pourra pas être respectée, dis-le rapidement. Cela nous permet de revoir
                les priorités, de trouver du soutien ou d'informer le client au bon moment.
              </p>
              <p>
                Garde les informations et les fichiers du projet dans les outils et les dossiers prévus à
                cet effet. Une autre personne doit pouvoir reprendre un dossier sans avoir à chercher les
                décisions dans des messages privés ou uniquement sur ton ordinateur.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section id="section-6" className="scroll-mt-6">
            <SectionHeading number="6" title="Relation avec les clients" />
            <div className="space-y-3 text-slate-300 leading-relaxed mt-5">
              <p>
                Nos clients nous confient une partie importante de leur entreprise. Nous traitons leurs
                projets, leurs questions et leurs préoccupations avec attention, franchise et professionnalisme.
              </p>
              <p>
                Notre ton peut être chaleureux et accessible tout en restant clair et précis. Nous expliquons
                nos recommandations dans des mots que le client comprend et nous évitons de promettre un
                résultat que nous ne pouvons pas garantir.
              </p>
              <p>
                Avant de confirmer une date, un prix, une fonctionnalité ou l'ajout d'une demande au mandat,
                valide ce qui doit l'être avec la personne responsable du projet. Une demande qui semble
                simple peut nécessiter plusieurs étapes de travail.
              </p>
              <p>
                Si un problème survient, nous le signalons, nous expliquons ce que nous savons, nous proposons
                une solution et nous faisons le suivi. La rapidité et la clarté de notre communication
                comptent autant que la résolution du problème.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section id="section-7" className="scroll-mt-6">
            <SectionHeading number="7" title="Création, révisions et approbations" />
            <div className="space-y-3 text-slate-300 leading-relaxed mt-5">
              <p>
                Chaque proposition doit servir la marque du client et l'objectif du mandat. Avant de produire,
                consulte les informations…
              </p>
            </div>
            <div className="mt-6 flex gap-3 p-4 rounded-xl bg-amber-950/30 border border-amber-800/40">
              <span className="text-amber-400 flex-shrink-0 mt-0.5 text-base">⚠</span>
              <p className="text-amber-300 text-sm leading-relaxed">
                <strong className="text-amber-200">Section incomplète.</strong>{' '}
                Le texte fourni s'arrête ici. Merci de compléter le contenu de la section 7 et de mettre
                ce guide à jour.
              </p>
            </div>
          </section>

        </article>
      </div>
    </div>
  )
}

function SectionHeading({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3 pb-3 border-b border-slate-700/60">
      <span className="text-xs font-bold text-blue-400 bg-blue-950/60 border border-blue-800/40 rounded px-2 py-0.5 flex-shrink-0">
        {number}
      </span>
      <h2 className="text-xl font-bold text-white">{title}</h2>
    </div>
  )
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-2">
      {children}
    </h3>
  )
}

function StepCard({ step, label, children }: { step: string; label: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
          {step}
        </span>
        <h3 className="font-semibold text-white">{label}</h3>
      </div>
      <p className="text-slate-300 text-sm leading-relaxed">{children}</p>
    </div>
  )
}
