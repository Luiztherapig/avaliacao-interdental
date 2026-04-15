import { DEFAULT_UNIT_SLUG } from "@/lib/constants/site";
import { getPublicBootstrap } from "@/lib/queries/public";
import { LandingHero } from "@/components/public/landing-hero";

export default async function HomePage() {
  const data = await getPublicBootstrap(DEFAULT_UNIT_SLUG);

  const title =
    data?.settings.landing_title ??
    "Sua opinião ajuda a Interdental a cuidar melhor de cada atendimento.";
  const subtitle =
    data?.settings.landing_subtitle ??
    "A avaliação é rápida, leva menos de 1 minuto e nos ajuda a evoluir com mais precisão.";

  return <LandingHero title={title} subtitle={subtitle} />;
}
