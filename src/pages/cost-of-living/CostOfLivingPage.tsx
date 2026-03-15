import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { useCostOfLivingCities, useCostOfLivingConfigs } from '@/hooks/useCostOfLiving';
import type { CityData, UserConfig } from './types';
import MapScreen from './components/MapScreen';
import ConfiguratorScreen from './components/ConfiguratorScreen';
import ResultScreen from './components/ResultScreen';
import ComparatorScreen from './components/ComparatorScreen';

type Screen = 'map' | 'configurator' | 'result' | 'comparator';

function CostOfLivingContent() {
  const { cities, isLoading: citiesLoading } = useCostOfLivingCities();
  const { configs, isLoading: configsLoading } = useCostOfLivingConfigs();
  const [screen, setScreen] = useState<Screen>('map');
  const [selectedCity, setSelectedCity] = useState<CityData | null>(null);
  const [userConfig, setUserConfig] = useState<UserConfig | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const deepLinkApplied = useRef(false);

  // Deep-link: read URL params and jump to result screen
  useEffect(() => {
    if (deepLinkApplied.current || citiesLoading || configsLoading || cities.length === 0) return;
    const citySlug = searchParams.get('city');
    const salary = searchParams.get('salary');
    if (!citySlug || !salary) return;

    const city = cities.find(c => c.slug === citySlug);
    if (!city) return;

    deepLinkApplied.current = true;
    const family = searchParams.get('family') as UserConfig['familySize'] || 'single';
    const lifestyle = searchParams.get('lifestyle') as UserConfig['lifestyle'] || 'moderate';
    const children = parseInt(searchParams.get('children') || '0', 10);
    const field = searchParams.get('field') || 'Tech';

    setSelectedCity(city);
    setUserConfig({ salary: Number(salary), familySize: family, children, lifestyle, field });
    setScreen('result');
    // Clean URL params without reload
    setSearchParams({}, { replace: true });
  }, [citiesLoading, configsLoading, cities, searchParams, setSearchParams]);

  if (citiesLoading || configsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (!configs || cities.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
        Nenhuma cidade configurada ainda.
      </div>
    );
  }

  const handleSelectCity = (city: CityData) => {
    setSelectedCity(city);
    setScreen('configurator');
  };

  const handleCalculate = (config: UserConfig) => {
    setUserConfig(config);
    setScreen('result');
  };

  switch (screen) {
    case 'map':
      return <MapScreen cities={cities} onSelectCity={handleSelectCity} />;

    case 'configurator':
      return selectedCity ? (
        <ConfiguratorScreen
          city={selectedCity}
          fields={configs.fields}
          onCalculate={handleCalculate}
          onBack={() => setScreen('map')}
        />
      ) : null;

    case 'result':
      return selectedCity && userConfig ? (
        <ResultScreen
          city={selectedCity}
          cities={cities}
          config={userConfig}
          configs={configs}
          onBack={() => setScreen('configurator')}
          onCompare={() => setScreen('comparator')}
        />
      ) : null;

    case 'comparator':
      return selectedCity && userConfig ? (
        <ComparatorScreen
          city={selectedCity}
          cities={cities}
          config={userConfig}
          configs={configs}
          onBack={() => setScreen('result')}
        />
      ) : null;

    default:
      return null;
  }
}

export default function CostOfLivingPage() {
  const { user } = useAuth();

  if (user) {
    return (
      <DashboardLayout>
        <CostOfLivingContent />
      </DashboardLayout>
    );
  }

  return (
    <>
      <Navbar />
      <div className="pt-16">
        <CostOfLivingContent />
      </div>
      <Footer />
    </>
  );
}
