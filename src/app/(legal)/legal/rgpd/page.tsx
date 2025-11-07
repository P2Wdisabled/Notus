import Link from "next/link";
import { Button, Card, Badge, Separator } from "@/components/ui";
import TableOfContents from "@/components/legal/TableOfContents";

export default function RGPDPage() {
  const sections = [
    { id: "definitions", title: "Définitions" },
    { id: "presentation", title: "1. Présentation du site internet" },
    { id: "conditions", title: "2. Conditions générales d'utilisation" },
    { id: "services", title: "3. Description des services fournis" },
    { id: "limitations", title: "4. Limitations contractuelles" },
    { id: "propriete", title: "5. Propriété intellectuelle" },
    { id: "responsabilite", title: "6. Limitations de responsabilité" },
    { id: "donnees", title: "7. Gestion des données personnelles" },
    { id: "incident", title: "8. Notification d'incident" },
    { id: "cookies", title: "9. Liens hypertextes, cookies et balises" },
    { id: "droit", title: "10. Droit applicable" }
  ];

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header Section */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Mentions légales RGPD
          </h1>
          <Badge variant="outline" className="text-sm">
            Dernière mise à jour : 18 septembre 2025
          </Badge>
        </header>

        {/* Table des matières - Toujours en haut */}
        <section className="mb-8">
          <Card>
            <Card.Header>
              <Card.Title className="text-lg text-foreground">Table des matières</Card.Title>
            </Card.Header>
            <Card.Content>
              <TableOfContents sections={sections} />
            </Card.Content>
          </Card>
        </section>

        {/* Contenu principal */}
        <section className="max-w-4xl mx-auto">
            <Card>
              <Card.Content className="p-8">
                <div className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground">

                  <section id="definitions" className="mb-12">
                    <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
                      Définitions
                    </h2>
                    <div className="space-y-4">
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="mb-2">
                          <strong className="text-primary">Client :</strong> tout professionnel ou personne physique
                          capable au sens des articles 1123 et suivants du Code civil, ou
                          personne morale, qui visite le Site objet des présentes conditions
                          générales.
                        </p>
                      </div>

                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="mb-2">
                          <strong className="text-primary">Prestations et Services :</strong> https://notus.fr met à
                          disposition des Clients :
                        </p>
                      </div>

                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="mb-2">
                          <strong className="text-primary">Contenu :</strong> Ensemble des éléments constituants
                          l'information présente sur le Site, notamment textes – images –
                          vidéos.
                        </p>
                      </div>

                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="mb-2">
                          <strong className="text-primary">Informations clients :</strong> Ci après dénommé «
                          Information (s) » qui correspondent à l'ensemble des données
                          personnelles susceptibles d'être détenues par https://notus.fr
                          pour la gestion de votre compte, de la gestion de la relation
                          client et à des fins d'analyses et de statistiques.
                        </p>
                      </div>

                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="mb-2">
                          <strong className="text-primary">Utilisateur :</strong> Internaute se connectant, utilisant
                          le site susnommé.
                        </p>
                      </div>

                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="mb-2">
                          <strong className="text-primary">Informations personnelles :</strong> « Les informations
                          qui permettent, sous quelque forme que ce soit, directement ou
                          non, l'identification des personnes physiques auxquelles elles
                          s'appliquent » (article 4 de la loi n° 78-17 du 6 janvier 1978).
                        </p>
                      </div>

                      <div className="bg-primary/10 p-4 rounded-lg border-l-4 border-primary">
                        <p className="text-sm text-muted-foreground">
                          Les termes « données à caractère personnel », « personne concernée
                          », « sous traitant » et « données sensibles » ont le sens défini
                          par le Règlement Général sur la Protection des Données (RGPD : n°
                          2016-679)
                        </p>
                      </div>
                    </div>
                  </section>

                  <section id="presentation" className="mb-12">
                    <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
                      1. Présentation du site internet
                    </h2>
                    <div className="space-y-6">
                      <p className="text-foreground leading-relaxed">
                        En vertu de l'article 6 de la loi n° 2004-575 du 21 juin 2004 pour
                        la confiance dans l'économie numérique, il est précisé aux
                        utilisateurs du site internet https://notus.fr l'identité des
                        différents intervenants dans le cadre de sa réalisation et de son
                        suivi:
                      </p>

                      <div className="bg-muted/30 p-6 rounded-lg">
                        <ul className="space-y-4">
                          <li className="flex flex-col sm:flex-row sm:items-start">
                            <strong className="text-primary min-w-[140px]">Propriétaire :</strong>
                            <span className="text-foreground">SARL Notus Capital social de
                            5000€ Numéro de TVA: FR02921419131 – 12 allée andré maurois
                            87000 Limoges</span>
                          </li>
                          <li className="flex flex-col sm:flex-row sm:items-start">
                            <strong className="text-primary min-w-[140px]">Responsable publication :</strong>
                            <span className="text-foreground">Lajudie –
                            francoispierre.lajudie@etu.unilim.fr</span>
                          </li>
                          <li className="flex flex-col sm:flex-row sm:items-start">
                            <strong className="text-primary min-w-[140px]">Webmaster :</strong>
                            <span className="text-foreground">POTEVIN – 763883580</span>
                          </li>
                          <li className="flex flex-col sm:flex-row sm:items-start">
                            <strong className="text-primary min-w-[140px]">Hébergeur :</strong>
                            <span className="text-foreground break-words break-all">OVH – 2, rue Kellermann 59100
                            Roubaix
                            https://help.ovhcloud.com/csm?id=contact_us_ovh&_gl=1*1vxqtla*_gcl_au*NzQ5MTIwMjM4LjE3NTU3MDE2NzA.</span>
                          </li>
                          <li className="flex flex-col sm:flex-row sm:items-start">
                            <strong className="text-primary min-w-[140px]">Délégué à la protection des données :</strong>
                            <span className="text-foreground">LegalPlace – contact@LegalPlace.fr</span>
                          </li>
                        </ul>
                      </div>

                      <div className="bg-primary/5 p-4 rounded-lg border-l-4 border-primary">
                        <p className="text-sm text-muted-foreground">
                          Ces mentions légales RGPD sont issues du générateur de mentions
                          légales RGPD créé par l'agence web Evico
                        </p>
                      </div>
                    </div>
                  </section>

                  <section id="conditions" className="mb-12">
                    <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
                      2. Conditions générales d'utilisation du site et des services proposés
                    </h2>
                    <div className="space-y-6">
                      <div className="bg-muted/30 p-6 rounded-lg">
                        <p className="text-foreground leading-relaxed mb-4">
                          Le Site constitue une œuvre de l'esprit protégée par les
                          dispositions du Code de la Propriété Intellectuelle et des
                          Réglementations Internationales applicables. Le Client ne peut en
                          aucune manière réutiliser, céder ou exploiter pour son propre
                          compte tout ou partie des éléments ou travaux du Site.
                        </p>
                      </div>

                      <p className="text-foreground leading-relaxed">
                        L'utilisation du site https://notus.fr implique l'acceptation
                        pleine et entière des conditions générales d'utilisation ci-après
                        décrites. Ces conditions d'utilisation sont susceptibles d'être
                        modifiées ou complétées à tout moment, les utilisateurs du site
                        https://notus.fr sont donc invités à les consulter de manière
                        régulière.
                      </p>

                      <div className="bg-primary/5 p-4 rounded-lg border-l-4 border-primary">
                        <p className="text-foreground leading-relaxed">
                          Ce site internet est normalement accessible à tout moment aux
                          utilisateurs. Une interruption pour raison de maintenance
                          technique peut être toutefois décidée par https://notus.fr, qui
                          s'efforcera alors de communiquer préalablement aux utilisateurs
                          les dates et heures de l'intervention.
                        </p>
                      </div>

                      <p className="text-foreground leading-relaxed">
                        Le site web https://notus.fr est mis à jour régulièrement par
                        https://notus.fr responsable. De la même façon, les mentions
                        légales peuvent être modifiées à tout moment : elles s'imposent
                        néanmoins à l'utilisateur qui est invité à s'y référer le plus
                        souvent possible afin d'en prendre connaissance.
                      </p>
                    </div>
                  </section>

                  <section id="services" className="mb-12">
                    <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
                      3. Description des services fournis
                    </h2>
                    <div className="space-y-6">
                      <p className="text-foreground leading-relaxed">
                        Le site internet https://notus.fr a pour objet de fournir une
                        information concernant l'ensemble des activités de la société.
                        https://notus.fr s'efforce de fournir sur le site https://notus.fr
                        des informations aussi précises que possible. Toutefois, il ne
                        pourra être tenu responsable des oublis, des inexactitudes et des
                        carences dans la mise à jour, qu'elles soient de son fait ou du
                        fait des tiers partenaires qui lui fournissent ces informations.
                      </p>

                      <div className="bg-muted/30 p-6 rounded-lg">
                        <p className="text-foreground leading-relaxed">
                          Toutes les informations indiquées sur le site https://notus.fr
                          sont données à titre indicatif, et sont susceptibles d'évoluer.
                          Par ailleurs, les renseignements figurant sur le site
                          https://notus.fr ne sont pas exhaustifs. Ils sont donnés sous
                          réserve de modifications ayant été apportées depuis leur mise en
                          ligne.
                        </p>
                      </div>
                    </div>
                  </section>

                  <section id="limitations" className="mb-12">
                    <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
                      4. Limitations contractuelles sur les données techniques
                    </h2>
                    <div className="space-y-6">
                      <div className="bg-muted/30 p-6 rounded-lg">
                        <p className="text-foreground leading-relaxed mb-4">
                          Le site utilise la technologie JavaScript. Le site Internet ne
                          pourra être tenu responsable de dommages matériels liés à
                          l'utilisation du site. De plus, l'utilisateur du site s'engage à
                          accéder au site en utilisant un matériel récent, ne contenant pas
                          de virus et avec un navigateur de dernière génération mis-à-jour
                        </p>
                      </div>

                      <div className="bg-primary/5 p-4 rounded-lg border-l-4 border-primary">
                        <p className="text-foreground leading-relaxed">
                          Le site https://notus.fr est hébergé chez un prestataire sur le
                          territoire de l'Union Européenne conformément aux dispositions du
                          Règlement Général sur la Protection des Données (RGPD : n°
                          2016-679)
                        </p>
                      </div>

                      <p className="text-foreground leading-relaxed">
                        L'objectif est d'apporter une prestation qui assure le meilleur
                        taux d'accessibilité. L'hébergeur assure la continuité de son
                        service 24 Heures sur 24, tous les jours de l'année. Il se réserve
                        néanmoins la possibilité d'interrompre le service d'hébergement
                        pour les durées les plus courtes possibles notamment à des fins de
                        maintenance, d'amélioration de ses infrastructures, de défaillance
                        de ses infrastructures ou si les Prestations et Services génèrent
                        un trafic réputé anormal.
                      </p>

                      <div className="bg-muted/30 p-6 rounded-lg">
                        <p className="text-foreground leading-relaxed">
                          https://notus.fr et l'hébergeur ne pourront être tenus
                          responsables en cas de dysfonctionnement du réseau Internet, des
                          lignes téléphoniques ou du matériel informatique et de téléphonie
                          lié notamment à l'encombrement du réseau empêchant l'accès au
                          serveur.
                        </p>
                      </div>
                    </div>
                  </section>

                  <section id="propriete" className="mb-12">
                    <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
                      5. Propriété intellectuelle et contrefaçons
                    </h2>
                    <div className="space-y-6">
                      <div className="bg-muted/30 p-6 rounded-lg">
                        <p className="text-foreground leading-relaxed mb-4">
                          https://notus.fr est propriétaire des droits de propriété
                          intellectuelle et détient les droits d'usage sur tous les éléments
                          accessibles sur le site internet, notamment les textes, images,
                          graphismes, logos, vidéos, icônes et sons.
                        </p>
                      </div>

                      <p className="text-foreground leading-relaxed">
                        Toute reproduction, représentation, modification, publication,
                        adaptation de tout ou partie des éléments du site, quel que soit
                        le moyen ou le procédé utilisé, est interdite, sauf autorisation
                        écrite préalable de : https://notus.fr.
                      </p>

                      <div className="bg-primary/5 p-4 rounded-lg border-l-4 border-primary">
                        <p className="text-foreground leading-relaxed">
                          Toute exploitation non autorisée du site ou de l'un quelconque des
                          éléments qu'il contient sera considérée comme constitutive d'une
                          contrefaçon et poursuivie conformément aux dispositions des
                          articles L.335-2 et suivants du Code de Propriété Intellectuelle.
                        </p>
                      </div>
                    </div>
                  </section>

                  <section id="responsabilite" className="mb-12">
                    <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
                      6. Limitations de responsabilité
                    </h2>
                    <div className="space-y-6">
                      <div className="bg-muted/30 p-6 rounded-lg">
                        <p className="text-foreground leading-relaxed mb-4">
                          https://notus.fr agit en tant qu'éditeur du site. https://notus.fr
                          est responsable de la qualité et de la véracité du Contenu qu'il
                          publie.
                        </p>
                      </div>

                      <p className="text-foreground leading-relaxed">
                        https://notus.fr ne pourra être tenu responsable des dommages
                        directs et indirects causés au matériel de l'utilisateur, lors de
                        l'accès au site internet https://notus.fr, et résultant soit de
                        l'utilisation d'un matériel ne répondant pas aux spécifications
                        indiquées au point 4, soit de l'apparition d'un bug ou d'une
                        incompatibilité.
                      </p>

                      <p className="text-foreground leading-relaxed">
                        https://notus.fr ne pourra également être tenu responsable des
                        dommages indirects (tels par exemple qu'une perte de marché ou
                        perte d'une chance) consécutifs à l'utilisation du site
                        https://notus.fr.
                      </p>

                      <div className="bg-primary/5 p-4 rounded-lg border-l-4 border-primary">
                        <p className="text-foreground leading-relaxed mb-4">
                          Des espaces interactifs (possibilité de poser des questions dans
                          l'espace contact) sont à la disposition des utilisateurs.
                          https://notus.fr se réserve le droit de supprimer, sans mise en
                          demeure préalable, tout contenu déposé dans cet espace qui
                          contreviendrait à la législation applicable en France, en
                          particulier aux dispositions relatives à la protection des
                          données.
                        </p>
                      </div>

                      <p className="text-foreground leading-relaxed">
                        Le cas échéant, https://notus.fr se réserve également la
                        possibilité de mettre en cause la responsabilité civile et/ou
                        pénale de l'utilisateur, notamment en cas de message à caractère
                        raciste, injurieux, diffamant, ou pornographique, quel que soit le
                        support utilisé (texte, photographie …).
                      </p>
                    </div>
                  </section>

                  <section id="donnees" className="mb-12">
                    <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
                      7. Gestion des données personnelles
                    </h2>
                    <div className="space-y-6">
                      <div className="bg-primary/10 p-6 rounded-lg border-l-4 border-primary">
                        <p className="text-foreground leading-relaxed">
                          Le Client est informé des réglementations concernant la
                          communication marketing, la loi du 21 Juin 2014 pour la confiance
                          dans l'Economie Numérique, la Loi Informatique et Liberté du 06
                          Août 2004 ainsi que du Règlement Général sur la Protection des
                          Données (RGPD : n° 2016-679).
                        </p>
                      </div>

                      <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-foreground mb-4">7.1 Responsables de la collecte des données personnelles</h3>
                        <div className="bg-muted/30 p-6 rounded-lg">
                          <p className="text-foreground leading-relaxed mb-4">
                            Pour les Données Personnelles collectées dans le cadre de la
                            création du compte personnel de l'Utilisateur et de sa navigation
                            sur le Site, le responsable du traitement des Données Personnelles
                            est : Notus. https://notus.fr est représenté par Lemesle, son
                            représentant légal
                          </p>
                        </div>

                        <p className="text-foreground leading-relaxed">
                          En tant que responsable du traitement des données qu'il collecte,
                          https://notus.fr s'engage à respecter le cadre des dispositions
                          légales en vigueur. Il lui appartient notamment au Client
                          d'établir les finalités de ses traitements de données, de fournir
                          à ses prospects et clients, à partir de la collecte de leurs
                          consentements, une information complète sur le traitement de leurs
                          données personnelles et de maintenir un registre des traitements
                          conforme à la réalité.
                        </p>

                        <div className="bg-primary/5 p-4 rounded-lg border-l-4 border-primary">
                          <p className="text-foreground leading-relaxed">
                            Chaque fois que https://notus.fr traite des Données Personnelles,
                            https://notus.fr prend toutes les mesures raisonnables pour
                            s'assurer de l'exactitude et de la pertinence des Données
                            Personnelles au regard des finalités pour lesquelles
                            https://notus.fr les traite.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-foreground mb-4">7.2 Finalité des données collectées</h3>
                        <p className="text-foreground leading-relaxed">
                          https://notus.fr est susceptible de traiter tout ou partie des
                          données :
                        </p>
                        <div className="bg-muted/30 p-6 rounded-lg">
                          <ul className="space-y-3">
                            <li className="flex items-start">
                              <span className="text-primary mr-2">•</span>
                              <span className="text-foreground">
                                pour permettre la navigation sur le Site et la gestion et la
                                traçabilité des prestations et services commandés par
                                l'utilisateur : données de connexion et d'utilisation du Site,
                                facturation, historique des commandes, etc.
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="text-primary mr-2">•</span>
                              <span className="text-foreground">
                                pour prévenir et lutter contre la fraude informatique (spamming,
                                hacking…) : matériel informatique utilisé pour la navigation,
                                l'adresse IP, le mot de passe (hashé)
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="text-primary mr-2">•</span>
                              <span className="text-foreground">
                                pour améliorer la navigation sur le Site : données de connexion
                                et d'utilisation
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="text-primary mr-2">•</span>
                              <span className="text-foreground">
                                pour mener des enquêtes de satisfaction facultatives sur
                                https://notus.fr : adresse email
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="text-primary mr-2">•</span>
                              <span className="text-foreground">
                                pour mener des campagnes de communication (sms, mail) : numéro
                                de téléphone, adresse email
                              </span>
                            </li>
                          </ul>
                        </div>

                        <div className="bg-primary/5 p-4 rounded-lg border-l-4 border-primary">
                          <p className="text-foreground leading-relaxed">
                            https://notus.fr ne commercialise pas vos données personnelles qui
                            sont donc uniquement utilisées par nécessité ou à des fins
                            statistiques et d'analyses.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-foreground mb-4">7.3 Droit d'accès, de rectification et d'opposition</h3>
                        <div className="bg-primary/10 p-6 rounded-lg border-l-4 border-primary">
                          <p className="text-foreground leading-relaxed mb-4">
                            Conformément à la réglementation européenne en vigueur, les
                            Utilisateurs de https://notus.fr disposent des droits suivants :
                          </p>
                        </div>
                        <div className="bg-muted/30 p-6 rounded-lg">
                          <ul className="space-y-4">
                            <li className="flex items-start">
                              <span className="text-primary mr-3 font-bold">1.</span>
                              <span className="text-foreground">
                                droit d'accès (article 15 RGPD) et de rectification (article 16
                                RGPD), de mise à jour, de complétude des données des
                                Utilisateurs
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="text-primary mr-3 font-bold">2.</span>
                              <span className="text-foreground">
                                droit de verrouillage ou d'effacement des données des
                                Utilisateurs à caractère personnel (article 17 du RGPD),
                                lorsqu'elles sont inexactes, incomplètes, équivoques, périmées,
                                ou dont la collecte, l'utilisation, la communication ou la
                                conservation est interdite
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="text-primary mr-3 font-bold">3.</span>
                              <span className="text-foreground">
                                droit de retirer à tout moment un consentement (article 13-2c
                                RGPD)
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="text-primary mr-3 font-bold">4.</span>
                              <span className="text-foreground">
                                droit à la limitation du traitement des données des Utilisateurs
                                (article 18 RGPD)
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="text-primary mr-3 font-bold">5.</span>
                              <span className="text-foreground">
                                droit d'opposition au traitement des données des Utilisateurs
                                (article 21 RGPD)
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="text-primary mr-3 font-bold">6.</span>
                              <span className="text-foreground">
                                droit à la portabilité des données que les Utilisateurs auront
                                fournies, lorsque ces données font l'objet de traitements
                                automatisés fondés sur leur consentement ou sur un contrat
                                (article 20 RGPD)
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="text-primary mr-3 font-bold">7.</span>
                              <span className="text-foreground">
                                droit de définir le sort des données des Utilisateurs après leur
                                mort et de choisir à qui https://notus.fr devra communiquer (ou
                                non) ses données à un tiers qu'ils aura préalablement désigné
                              </span>
                            </li>
                          </ul>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <p className="text-foreground leading-relaxed">
                          Dès que https://notus.fr a connaissance du décès d'un Utilisateur
                          et à défaut d'instructions de sa part, https://notus.fr s'engage à
                          détruire ses données, sauf si leur conservation s'avère nécessaire
                          à des fins probatoires ou pour répondre à une obligation légale.
                        </p>

                        <div className="bg-muted/30 p-6 rounded-lg">
                          <p className="text-foreground leading-relaxed mb-4">
                            Si l'Utilisateur souhaite savoir comment https://notus.fr utilise
                            ses Données Personnelles, demander à les rectifier ou s'oppose à
                            leur traitement, l'Utilisateur peut contacter https://notus.fr par
                            écrit à l'adresse suivante :
                          </p>
                          <div className="bg-primary/10 p-4 rounded-lg border-l-4 border-primary">
                            <p className="text-foreground font-semibold">
                              Notus – DPO, LegalPlace
                              <br />
                              12 allée andré maurois
                              <br />
                              87000 Limoges
                            </p>
                          </div>
                        </div>

                        <p className="text-foreground leading-relaxed">
                          Dans ce cas, l'Utilisateur doit indiquer les Données Personnelles
                          qu'il souhaiterait que https://notus.fr corrige, mette à jour ou
                          supprime, en s'identifiant précisément avec une copie d'une pièce
                          d'identité (carte d'identité ou passeport).
                        </p>

                        <p className="text-foreground leading-relaxed">
                          Les demandes de suppression de Données Personnelles seront
                          soumises aux obligations qui sont imposées à https://notus.fr par
                          la loi, notamment en matière de conservation ou d'archivage des
                          documents.
                        </p>

                        <div className="bg-primary/5 p-4 rounded-lg border-l-4 border-primary">
                          <p className="text-foreground leading-relaxed">
                            Enfin, les Utilisateurs de https://notus.fr peuvent déposer une
                            réclamation auprès des autorités de contrôle, et notamment de la
                            CNIL (https://www.cnil.fr/fr/plaintes).
                          </p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-foreground mb-4">7.4 Non-communication des données personnelles</h3>
                        <div className="bg-muted/30 p-6 rounded-lg">
                          <p className="text-foreground leading-relaxed mb-4">
                            https://notus.fr s'interdit de traiter, héberger ou transférer les
                            Informations collectées sur ses Clients vers un pays situé en
                            dehors de l'Union européenne ou reconnu comme « non adéquat » par
                            la Commission européenne sans en informer préalablement le client.
                          </p>
                        </div>

                        <p className="text-foreground leading-relaxed">
                          Pour autant, https://notus.fr reste libre du choix de ses
                          sous-traitants techniques et commerciaux à la condition qu'il
                          présentent les garanties suffisantes au regard des exigences du
                          Règlement Général sur la Protection des Données (RGPD : n°
                          2016-679).
                        </p>

                        <div className="bg-primary/5 p-4 rounded-lg border-l-4 border-primary">
                          <p className="text-foreground leading-relaxed mb-4">
                            https://notus.fr s'engage à prendre toutes les précautions
                            nécessaires afin de préserver la sécurité des Informations et
                            notamment qu'elles ne soient pas communiquées à des personnes non
                            autorisées. Cependant, si un incident impactant l'intégrité ou la
                            confidentialité des Informations du Client est portée à la
                            connaissance de https://notus.fr, celle-ci devra dans les
                            meilleurs délais informer le Client et lui communiquer les mesures
                            de corrections prises.
                          </p>
                        </div>

                        <div className="bg-muted/30 p-6 rounded-lg">
                          <p className="text-foreground leading-relaxed mb-4">
                            Par ailleurs https://notus.fr ne collecte aucune « données
                            sensibles ».
                          </p>
                        </div>

                        <p className="text-foreground leading-relaxed">
                          Les Données Personnelles de l'Utilisateur peuvent être traitées
                          par des filiales de https://notus.fr et des sous-traitants
                          (prestataires de services), exclusivement afin de réaliser les
                          finalités de la présente politique.
                        </p>

                        <p className="text-foreground leading-relaxed">
                          Dans la limite de leurs attributions respectives et pour les
                          finalités rappelées ci-dessus, les principales personnes
                          susceptibles d'avoir accès aux données des Utilisateurs de
                          https://notus.fr sont principalement les agents de notre service
                          client.
                        </p>
                      </div>

                      <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-foreground mb-4">7.5 Types de données collectées</h3>
                        <div className="bg-muted/30 p-6 rounded-lg">
                          <p className="text-foreground leading-relaxed mb-4">
                            Concernant les utilisateurs d'un Site https://notus.fr, nous
                            collectons les données suivantes qui sont indispensables au
                            fonctionnement du service, et qui seront conservées pendant une
                            période maximale de 9 mois après la fin de la relation
                            contractuelle:
                          </p>
                          <div className="bg-primary/10 p-4 rounded-lg border-l-4 border-primary">
                            <p className="text-foreground font-semibold">
                              nom, prenom, email, nom d'utilisateur, mot de passe
                            </p>
                          </div>
                        </div>

                        <div className="bg-primary/5 p-4 rounded-lg border-l-4 border-primary">
                          <p className="text-foreground leading-relaxed">
                            https://notus.fr collecte en outre des informations qui permettent
                            d'améliorer l'expérience utilisateur et de proposer des conseils
                            contextualisés : Ces données sont conservées pour une période
                            maximale de 9 mois après la fin de la relation contractuelle
                          </p>
                        </div>
                      </div>

                    </div>
                  </section>

                  <section id="incident" className="mb-12">
                    <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
                      8. Notification d'incident
                    </h2>
                    <div className="space-y-6">
                      <div className="bg-primary/10 p-6 rounded-lg border-l-4 border-primary">
                        <p className="text-foreground leading-relaxed mb-4">
                          Quels que soient les efforts fournis, aucune méthode de
                          transmission sur Internet et aucune méthode de stockage
                          électronique n'est complètement sûre. Nous ne pouvons en
                          conséquence pas garantir une sécurité absolue. Si nous prenions
                          connaissance d'une brèche de la sécurité, nous avertirions les
                          utilisateurs concernés afin qu'ils puissent prendre les mesures
                          appropriées.
                        </p>
                      </div>

                      <p className="text-foreground leading-relaxed">
                        Nos procédures de notification d'incident tiennent compte de nos
                        obligations légales, qu'elles se situent au niveau national ou
                        européen. Nous nous engageons à informer pleinement nos clients de
                        toutes les questions relevant de la sécurité de leur compte et à
                        leur fournir toutes les informations nécessaires pour les aider à
                        respecter leurs propres obligations réglementaires en matière de
                        reporting.
                      </p>

                      <div className="bg-muted/30 p-6 rounded-lg">
                        <p className="text-foreground leading-relaxed">
                          Aucune information personnelle de l'utilisateur du site
                          https://notus.fr n'est publiée à l'insu de l'utilisateur,
                          échangée, transférée, cédée ou vendue sur un support quelconque à
                          des tiers. Seule l'hypothèse du rachat de https://notus.fr et de
                          ses droits permettrait la transmission des dites informations à
                          l'éventuel acquéreur qui serait à son tour tenu de la même
                          obligation de conservation et de modification des données vis à
                          vis de l'utilisateur du site https://notus.fr.
                        </p>
                      </div>

                      <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-foreground mb-4">Sécurité</h3>
                        <div className="bg-primary/5 p-4 rounded-lg border-l-4 border-primary">
                          <p className="text-foreground leading-relaxed mb-4">
                            Pour assurer la sécurité et la confidentialité des Données
                            Personnelles et des Données Personnelles de Santé,
                            https://notus.fr utilise des réseaux protégés par des dispositifs
                            standards tels que par pare-feu, la pseudonymisation, l'encryption
                            et mot de passe.
                          </p>
                        </div>

                        <p className="text-foreground leading-relaxed">
                          Lors du traitement des Données Personnelles, https://notus.fr
                          prend toutes les mesures raisonnables visant à les protéger contre
                          toute perte, utilisation détournée, accès non autorisé,
                          divulgation, altération ou destruction.
                        </p>
                      </div>
                    </div>
                  </section>

                  <section id="cookies" className="mb-12">
                    <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
                      9. Liens hypertextes, cookies et balises internet
                    </h2>
                    <div className="space-y-6">
                      <p className="text-foreground leading-relaxed">
                        Le site https://notus.fr contient un certain nombre de liens
                        hypertextes vers d'autres sites, mis en place avec l'autorisation
                        de https://notus.fr. Cependant, https://notus.fr n'a pas la
                        possibilité de vérifier le contenu des sites ainsi visités, et
                        n'assumera en conséquence aucune responsabilité de ce fait.
                      </p>

                      <div className="bg-primary/5 p-4 rounded-lg border-l-4 border-primary">
                        <p className="text-foreground leading-relaxed">
                          Sauf si vous décidez de désactiver les cookies, vous acceptez que
                          le site puisse les utiliser. Vous pouvez à tout moment désactiver
                          ces cookies et ce gratuitement à partir des possibilités de
                          désactivation qui vous sont offertes et rappelées ci-après,
                          sachant que cela peut réduire ou empêcher l'accessibilité à tout
                          ou partie des Services proposés par le site.
                        </p>
                      </div>

                      <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-foreground mb-4">9.1. Cookies</h3>
                        <div className="bg-muted/30 p-6 rounded-lg">
                          <p className="text-foreground leading-relaxed mb-4">
                            Un « cookie » est un petit fichier d'information envoyé sur le
                            navigateur de l'Utilisateur et enregistré au sein du terminal de
                            l'Utilisateur (ex : ordinateur, smartphone), (ci-après « Cookies
                            »). Ce fichier comprend des informations telles que le nom de
                            domaine de l'Utilisateur, le fournisseur d'accès Internet de
                            l'Utilisateur, le système d'exploitation de l'Utilisateur, ainsi
                            que la date et l'heure d'accès. Les Cookies ne risquent en aucun
                            cas d'endommager le terminal de l'Utilisateur.
                          </p>
                        </div>

                        <p className="text-foreground leading-relaxed">
                          https://notus.fr est susceptible de traiter les informations de
                          l'Utilisateur concernant sa visite du Site, telles que les pages
                          consultées, les recherches effectuées. Ces informations permettent
                          à https://notus.fr d'améliorer le contenu du Site, de la
                          navigation de l'Utilisateur.
                        </p>

                        <div className="bg-primary/5 p-4 rounded-lg border-l-4 border-primary">
                          <p className="text-foreground leading-relaxed mb-4">
                            Les Cookies facilitant la navigation et/ou la fourniture des
                            services proposés par le Site, l'Utilisateur peut configurer son
                            navigateur pour qu'il lui permette de décider s'il souhaite ou non
                            les accepter de manière à ce que des Cookies soient enregistrés
                            dans le terminal ou, au contraire, qu'ils soient rejetés, soit
                            systématiquement, soit selon leur émetteur.
                          </p>
                        </div>

                        <p className="text-foreground leading-relaxed">
                          L'Utilisateur peut également configurer son logiciel de navigation
                          de manière à ce que l'acceptation ou le refus des Cookies lui
                          soient proposés ponctuellement, avant qu'un Cookie soit
                          susceptible d'être enregistré dans son terminal.
                        </p>

                        <div className="bg-muted/30 p-6 rounded-lg">
                          <p className="text-foreground leading-relaxed mb-4">
                            https://notus.fr informe l'Utilisateur que, dans ce cas, il se
                            peut que les fonctionnalités de son logiciel de navigation ne
                            soient pas toutes disponibles.
                          </p>
                        </div>

                        <p className="text-foreground leading-relaxed">
                          Si l'Utilisateur refuse l'enregistrement de Cookies dans son
                          terminal ou son navigateur, ou si l'Utilisateur supprime ceux qui
                          y sont enregistrés, l'Utilisateur est informé que sa navigation et
                          son expérience sur le Site peuvent être limitées. Cela pourrait
                          également être le cas lorsque https://notus.fr ou l'un de ses
                          prestataires ne peut pas reconnaître, à des fins de compatibilité
                          technique, le type de navigateur utilisé par le terminal, les
                          paramètres de langue et d'affichage ou le pays depuis lequel le
                          terminal semble connecté à Internet.
                        </p>

                        <div className="bg-primary/5 p-4 rounded-lg border-l-4 border-primary">
                          <p className="text-foreground leading-relaxed mb-4">
                            Le cas échéant, https://notus.fr décline toute responsabilité pour
                            les conséquences liées au fonctionnement dégradé du Site et des
                            services éventuellement proposés par https://notus.fr, résultant
                            (i) du refus de Cookies par l'Utilisateur (ii) de l'impossibilité
                            pour https://notus.fr d'enregistrer ou de consulter les Cookies
                            nécessaires à leur fonctionnement du fait du choix de
                            l'Utilisateur.
                          </p>
                        </div>

                        <p className="text-foreground leading-relaxed">
                          Pour la gestion des Cookies et des choix de l'Utilisateur, la
                          configuration de chaque navigateur est différente. Elle est
                          décrite dans le menu d'aide du navigateur, qui permettra de savoir
                          de quelle manière l'Utilisateur peut modifier ses souhaits en
                          matière de Cookies.
                        </p>

                        <p className="text-foreground leading-relaxed">
                          À tout moment, l'Utilisateur peut faire le choix d'exprimer et de
                          modifier ses souhaits en matière de Cookies. https://notus.fr
                          pourra en outre faire appel aux services de prestataires externes
                          pour l'aider à recueillir et traiter les informations décrites
                          dans cette section.
                        </p>

                        <div className="bg-muted/30 p-6 rounded-lg">
                          <p className="text-foreground leading-relaxed mb-4">
                            Enfin, en cliquant sur les icônes dédiées aux réseaux sociaux
                            Twitter, Facebook, Linkedin et Google Plus figurant sur le Site de
                            https://notus.fr ou dans son application mobile et si
                            l'Utilisateur a accepté le dépôt de cookies en poursuivant sa
                            navigation sur le Site Internet ou l'application mobile de
                            https://notus.fr, Twitter, Facebook, Linkedin et Google Plus
                            peuvent également déposer des cookies sur vos terminaux
                            (ordinateur, tablette, téléphone portable).
                          </p>
                        </div>

                        <p className="text-foreground leading-relaxed">
                          Ces types de cookies ne sont déposés sur vos terminaux qu'à
                          condition que vous y consentiez, en continuant votre navigation
                          sur le Site Internet ou l'application mobile de https://notus.fr.
                          À tout moment, l'Utilisateur peut néanmoins revenir sur son
                          consentement à ce que https://notus.fr dépose ce type de cookies.
                        </p>
                      </div>

                      <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-foreground mb-4">9.2. Balises ("TAGS") Internet</h3>
                        <div className="bg-muted/30 p-6 rounded-lg">
                          <p className="text-foreground leading-relaxed mb-4">
                            https://notus.fr peut employer occasionnellement des balises
                            Internet (également appelées « tags », ou balises d'action, GIF à
                            un pixel, GIF transparents, GIF invisibles et GIF un à un) et les
                            déployer par l'intermédiaire d'un partenaire spécialiste
                            d'analyses Web susceptible de se trouver (et donc de stocker les
                            informations correspondantes, y compris l'adresse IP de
                            l'Utilisateur) dans un pays étranger.
                          </p>
                        </div>

                        <p className="text-foreground leading-relaxed">
                          Ces balises sont placées à la fois dans les publicités en ligne
                          permettant aux internautes d'accéder au Site, et sur les
                          différentes pages de celui-ci.
                        </p>

                        <div className="bg-primary/5 p-4 rounded-lg border-l-4 border-primary">
                          <p className="text-foreground leading-relaxed mb-4">
                            Cette technologie permet à https://notus.fr d'évaluer les réponses
                            des visiteurs face au Site et l'efficacité de ses actions (par
                            exemple, le nombre de fois où une page est ouverte et les
                            informations consultées), ainsi que l'utilisation de ce Site par
                            l'Utilisateur.
                          </p>
                        </div>

                        <p className="text-foreground leading-relaxed">
                          Le prestataire externe pourra éventuellement recueillir des
                          informations sur les visiteurs du Site et d'autres sites Internet
                          grâce à ces balises, constituer des rapports sur l'activité du
                          Site à l'attention de https://notus.fr, et fournir d'autres
                          services relatifs à l'utilisation de celui-ci et d'Internet.
                        </p>
                      </div>
                    </div>
                  </section>

                  <section id="droit" className="mb-12">
                    <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
                      10. Droit applicable et attribution de juridiction
                    </h2>
                    <div className="space-y-6">
                      <div className="bg-primary/10 p-6 rounded-lg border-l-4 border-primary">
                        <p className="text-foreground leading-relaxed">
                          Tout litige en relation avec l'utilisation du site
                          https://notus.fr est soumis au droit français. En dehors des cas
                          où la loi ne le permet pas, il est fait attribution exclusive de
                          juridiction aux tribunaux compétents de Paris
                        </p>
                      </div>
                    </div>
                  </section>
                </div>
              </Card.Content>
            </Card>
        </section>

        {/* Footer avec bouton de retour */}
        <footer className="flex justify-center mt-12">
          <Button asChild className="py-2 px-4 text-lg">
            <Link href="/">Retour à l'accueil</Link>
          </Button>
        </footer>
      </div>
    </main>
  );
}

