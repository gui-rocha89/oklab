import { Helmet } from 'react-helmet';
import { Nav } from '@/components/mkt/Nav';
import { Hero } from '@/components/mkt/Hero';
import { HowItWorks } from '@/components/mkt/HowItWorks';
import { FeatureBand } from '@/components/mkt/FeatureBand';
import { Differentials } from '@/components/mkt/Differentials';
import { Pricing } from '@/components/mkt/Pricing';
import { Addons } from '@/components/mkt/Addons';
import { Logos } from '@/components/mkt/Logos';
import { FAQ } from '@/components/mkt/FAQ';
import { Footer } from '@/components/mkt/Footer';
import { features } from '@/mkt/content';

const Home = () => {
  return (
    <>
      <Helmet>
        <title>OK Lab - Plataforma de Aprovação de Conteúdos Audiovisuais</title>
        <meta
          name="description"
          content="Aprove vídeos, briefings e social media com marcação direta no frame. Plataforma completa para agências, produtoras e equipes criativas. Teste grátis 14 dias."
        />
        <meta
          name="keywords"
          content="aprovação de vídeo, marcação no frame, feedback audiovisual, gestão de conteúdo, briefing, social media, agência criativa"
        />
        <link rel="canonical" href="https://oklab.app" />
        
        {/* Open Graph */}
        <meta property="og:title" content="OK Lab - Plataforma de Aprovação de Conteúdos" />
        <meta
          property="og:description"
          content="Aprove vídeos com marcação direta no frame. Plataforma completa para agências e produtoras."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://oklab.app" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="OK Lab - Aprovação de Conteúdos Audiovisuais" />
        <meta
          name="twitter:description"
          content="Aprove vídeos com marcação direta no frame. Teste grátis 14 dias."
        />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        <Nav />
        
        <main>
          <Hero />
          <HowItWorks />
          
          {/* Feature Bands */}
          <section id="recursos" className="py-24 bg-background">
            <div className="container px-4 sm:px-6 lg:px-8 space-y-32">
              {features.map((feature, idx) => (
                <FeatureBand
                  key={feature.id}
                  {...feature}
                  reverse={idx % 2 !== 0}
                />
              ))}
            </div>
          </section>

          <Differentials />
          <Pricing />
          <Addons />
          <Logos />
          <FAQ />
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default Home;
