'use client'

import Link from 'next/link'

export default function NonConcurrencePage() {
  return (
    <div className="max-w-3xl mx-auto pb-12">

      {/* Boutons nav — masqués à l'impression */}
      <div className="flex items-center justify-between mb-8 print:hidden">
        <Link href="/dashboard/guide" className="text-sm text-slate-400 hover:text-slate-200 transition flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Retour au guide
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Imprimer / Sauvegarder en PDF
        </button>
      </div>

      {/* Document */}
      <div className="bg-white text-gray-900 rounded-xl shadow-lg print:shadow-none print:rounded-none p-10 print:p-8 font-serif">

        {/* En-tête */}
        <div className="text-center border-b-2 border-gray-900 pb-6 mb-8">
          <p className="text-xs font-sans font-bold tracking-widest uppercase text-gray-500 mb-2">Agence 361°</p>
          <h1 className="text-2xl font-bold uppercase tracking-wide">Clause de non-concurrence</h1>
          <p className="text-sm text-gray-500 mt-2 font-sans">Conformément à l&apos;article 2089 du Code civil du Québec</p>
        </div>

        {/* Parties */}
        <section className="mb-8">
          <p className="text-sm font-sans font-semibold uppercase tracking-wider text-gray-500 mb-3">Entre les parties</p>
          <div className="space-y-3 text-sm leading-relaxed">
            <p>
              <strong>L&apos;Employeur :</strong> Agence 361° (ci-après désigné « l&apos;Employeur »), dont les bureaux
              sont situés à Sherbrooke (Québec).
            </p>
            <p>
              <strong>L&apos;Employé(e) :</strong>{' '}
              <span className="inline-block border-b border-gray-400 min-w-[260px]">&nbsp;</span>
              {' '}(ci-après désigné « l&apos;Employé(e) »)
            </p>
          </div>
        </section>

        {/* Clause 1 */}
        <section className="mb-6">
          <h2 className="text-sm font-sans font-bold uppercase tracking-wider mb-2">1. Objet</h2>
          <p className="text-sm leading-relaxed text-gray-700">
            Par la présente, l&apos;Employé(e) s&apos;engage, pour la période suivant la fin de son emploi,
            à ne pas exercer directement ou indirectement des activités concurrentes à celles de l&apos;Employeur,
            dans les limites prévues aux clauses ci-après. Cette obligation vise à protéger les intérêts
            légitimes de l&apos;Employeur, notamment sa clientèle, ses informations confidentielles et son
            savoir-faire particulier.
          </p>
        </section>

        {/* Clause 2 */}
        <section className="mb-6">
          <h2 className="text-sm font-sans font-bold uppercase tracking-wider mb-2">2. Durée</h2>
          <p className="text-sm leading-relaxed text-gray-700">
            La présente clause entre en vigueur à la date de fin d&apos;emploi, quelle qu&apos;en soit la cause,
            et demeure en vigueur pour une période de <strong>douze (12) mois</strong> suivant cette date.
          </p>
        </section>

        {/* Clause 3 */}
        <section className="mb-6">
          <h2 className="text-sm font-sans font-bold uppercase tracking-wider mb-2">3. Territoire</h2>
          <p className="text-sm leading-relaxed text-gray-700">
            La présente clause s&apos;applique sur l&apos;ensemble du territoire de la <strong>province de Québec</strong>.
          </p>
        </section>

        {/* Clause 4 */}
        <section className="mb-6">
          <h2 className="text-sm font-sans font-bold uppercase tracking-wider mb-2">4. Type de travail visé</h2>
          <p className="text-sm leading-relaxed text-gray-700">
            L&apos;Employé(e) s&apos;engage à ne pas offrir, directement ou indirectement — à titre d&apos;employé(e),
            de travailleur(euse) autonome, de consultant(e), d&apos;associé(e), d&apos;actionnaire ou autrement — les
            services suivants ou tout service similaire à ceux offerts par l&apos;Employeur au moment de la cessation
            d&apos;emploi :
          </p>
          <ul className="list-disc list-outside ml-5 mt-2 space-y-1 text-sm text-gray-700">
            <li>Marketing numérique et gestion de campagnes publicitaires en ligne</li>
            <li>Développement et conception de sites web</li>
            <li>Stratégie de marque et direction artistique</li>
            <li>Création de contenu (rédaction, photo, vidéo, infographie)</li>
            <li>Gestion des médias sociaux</li>
            <li>Référencement naturel (SEO) et publicité au paiement au clic (SEM/PPC)</li>
          </ul>
        </section>

        {/* Clause 5 */}
        <section className="mb-6">
          <h2 className="text-sm font-sans font-bold uppercase tracking-wider mb-2">5. Clients visés</h2>
          <p className="text-sm leading-relaxed text-gray-700">
            Cette restriction s&apos;applique à l&apos;égard des clients actuels de l&apos;Employeur et des clients
            potentiels avec lesquels l&apos;Employé(e) a eu des contacts directs dans les <strong>douze (12) mois</strong> précédant
            la fin de son emploi.
          </p>
        </section>

        {/* Clause 6 */}
        <section className="mb-6">
          <h2 className="text-sm font-sans font-bold uppercase tracking-wider mb-2">6. Inapplicabilité</h2>
          <p className="text-sm leading-relaxed text-gray-700">
            Conformément à l&apos;article 2095 du Code civil du Québec, l&apos;Employeur ne peut invoquer la
            présente clause s&apos;il a résilié le contrat de travail sans motif sérieux ou s&apos;il a
            lui-même fourni à l&apos;Employé(e) un motif sérieux de quitter son emploi.
          </p>
        </section>

        {/* Clause 7 */}
        <section className="mb-6">
          <h2 className="text-sm font-sans font-bold uppercase tracking-wider mb-2">7. Nullité</h2>
          <p className="text-sm leading-relaxed text-gray-700">
            Si l&apos;une des restrictions prévues à la présente clause était jugée déraisonnable ou invalide
            par un tribunal compétent, la clause entière serait réputée nulle et sans effet, conformément
            au droit québécois. Les parties reconnaissent qu&apos;aucune réduction judiciaire n&apos;est
            autorisée par le droit québécois.
          </p>
        </section>

        {/* Clause 8 */}
        <section className="mb-10">
          <h2 className="text-sm font-sans font-bold uppercase tracking-wider mb-2">8. Reconnaissance et acceptation</h2>
          <p className="text-sm leading-relaxed text-gray-700">
            L&apos;Employé(e) reconnaît avoir pris connaissance de la présente clause, en avoir compris la portée
            et les effets, et l&apos;accepter librement et sans contrainte. L&apos;Employé(e) reconnaît également
            que les restrictions prévues sont raisonnables compte tenu de la nature de ses fonctions et des
            intérêts légitimes de l&apos;Employeur.
          </p>
        </section>

        {/* Signatures */}
        <div className="border-t-2 border-gray-900 pt-8">
          <p className="text-sm font-sans font-semibold uppercase tracking-wider text-gray-500 mb-6">Signatures</p>

          <div className="grid grid-cols-2 gap-12">
            {/* Employé */}
            <div className="space-y-6">
              <div>
                <p className="text-xs font-sans font-semibold uppercase tracking-wider text-gray-500 mb-1">Employé(e)</p>
                <div className="border-b border-gray-400 h-8 mb-1" />
                <p className="text-xs text-gray-500 font-sans">Signature</p>
              </div>
              <div>
                <div className="border-b border-gray-400 h-8 mb-1" />
                <p className="text-xs text-gray-500 font-sans">Nom en lettres moulées</p>
              </div>
              <div>
                <div className="border-b border-gray-400 h-8 mb-1" />
                <p className="text-xs text-gray-500 font-sans">Date</p>
              </div>
            </div>

            {/* Employeur */}
            <div className="space-y-6">
              <div>
                <p className="text-xs font-sans font-semibold uppercase tracking-wider text-gray-500 mb-1">L&apos;Employeur</p>
                <div className="border-b border-gray-400 h-8 mb-1" />
                <p className="text-xs text-gray-500 font-sans">Signature</p>
              </div>
              <div>
                <div className="border-b border-gray-400 h-8 mb-1" />
                <p className="text-xs text-gray-500 font-sans">Nom et titre</p>
              </div>
              <div>
                <div className="border-b border-gray-400 h-8 mb-1" />
                <p className="text-xs text-gray-500 font-sans">Date</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400 font-sans mt-8 text-center">
            Agence 361° · Sherbrooke (Québec) · Document préparé conformément à l&apos;article 2089 C.c.Q.
          </p>
        </div>
      </div>

      {/* Note légale — masquée à l'impression */}
      <div className="mt-6 p-4 bg-amber-500/8 border border-amber-500/20 rounded-lg print:hidden">
        <p className="text-xs text-amber-400/80 leading-relaxed">
          <strong className="font-semibold">Note :</strong> Ce document constitue un modèle préparé selon les exigences
          de l&apos;article 2089 C.c.Q. Il est recommandé de le faire réviser par un avocat avant utilisation.
          Une clause de non-concurrence dont l&apos;un des éléments (durée, territoire, type de travail) est jugé
          déraisonnable par un tribunal est annulée en entier.
        </p>
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  )
}
