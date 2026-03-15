import { useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, TrendingUp, ArrowRight } from 'lucide-react';
import type { CityData } from '../types';

const geoUrl = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

interface MapScreenProps {
  cities: CityData[];
  onSelectCity: (city: CityData) => void;
}

export default function MapScreen({ cities, onSelectCity }: MapScreenProps) {
  const [hoveredCityId, setHoveredCityId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCities = searchQuery
    ? cities.filter(c =>
        c.city_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.state_code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const popularCities = cities.slice(0, 6);

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Left Panel: Content & Search */}
      <div className="w-full lg:w-5/12 xl:w-1/3 p-8 lg:p-12 flex flex-col justify-center z-10 relative border-r border-slate-200/60 bg-white/50 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-md mx-auto w-full"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-semibold tracking-wide uppercase mb-6">
            <TrendingUp size={14} />
            <span>Calculadora de Custo de Vida</span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-slate-900">
            Seu futuro nos <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-600">EUA</span>
          </h1>
          <p className="text-slate-500 text-lg mb-10 leading-relaxed">
            Descubra o custo de vida real em diferentes cidades americanas baseado no seu estilo de vida e profissão.
          </p>

          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Busque por cidade ou estado..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-6 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
            />

            <AnimatePresence>
              {searchQuery && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl z-50 max-h-64 overflow-y-auto"
                >
                  {filteredCities.length > 0 ? (
                    filteredCities.map((city) => (
                      <button
                        key={city.id}
                        onClick={() => { onSelectCity(city); setSearchQuery(''); }}
                        className="w-full text-left px-6 py-4 hover:bg-slate-50 flex items-center justify-between transition-colors border-b border-slate-100 last:border-0"
                      >
                        <div>
                          <span className="font-medium text-slate-900 block">{city.city_name}</span>
                          <span className="text-slate-500 text-sm">{city.state_code}</span>
                        </div>
                        <ArrowRight size={16} className="text-indigo-400" />
                      </button>
                    ))
                  ) : (
                    <div className="px-6 py-8 text-slate-500 text-center">Nenhuma cidade encontrada</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {!searchQuery && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Destinos Populares</h3>
              <div className="grid grid-cols-2 gap-3">
                {popularCities.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => onSelectCity(city)}
                    className="flex flex-col items-start p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 transition-all text-left group"
                  >
                    <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{city.city_name}</span>
                    <span className="text-slate-500 text-sm">{city.state_code}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Right Panel: Map */}
      <div className="w-full lg:w-7/12 xl:w-2/3 relative min-h-[50vh] lg:min-h-screen bg-slate-50 flex items-center justify-center p-4 lg:p-12">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-4xl relative z-10"
        >
          <div className="relative w-full aspect-[4/3] md:aspect-[16/10] bg-white/80 backdrop-blur-sm rounded-[2.5rem] border border-slate-200/80 overflow-hidden shadow-2xl">
            <ComposableMap projection="geoAlbersUsa" className="w-full h-full">
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#f1f5f9"
                      stroke="#cbd5e1"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: 'none', transition: 'all 250ms' },
                        hover: { fill: '#e2e8f0', outline: 'none', transition: 'all 250ms' },
                        pressed: { outline: 'none' },
                      }}
                    />
                  ))
                }
              </Geographies>

              {cities.map((city) => {
                const isHovered = hoveredCityId === city.id;
                const baseTotal = city.base_rent + city.base_food + city.base_transport + city.base_health + city.base_other;
                return (
                  <Marker
                    key={city.id}
                    coordinates={[city.longitude, city.latitude]}
                    onMouseEnter={() => setHoveredCityId(city.id)}
                    onMouseLeave={() => setHoveredCityId(null)}
                    onClick={() => onSelectCity(city)}
                    className="cursor-pointer"
                  >
                    <circle r={8} fill="#6366f1" opacity={isHovered ? 0.4 : 0.2} className="transition-opacity" />
                    <circle r={4} fill="#4f46e5" transform={isHovered ? 'scale(1.25)' : 'scale(1)'} className="transition-transform" />
                    {isHovered && (
                      <foreignObject x={12} y={-50} width={180} height={80} style={{ overflow: 'visible', pointerEvents: 'none' }}>
                        <div className="bg-slate-900 text-white px-3 py-2.5 rounded-xl shadow-2xl whitespace-nowrap">
                          <span className="font-semibold text-sm flex items-center gap-1.5">
                            <MapPin size={12} className="text-indigo-400" />
                            {city.city_name}, {city.state_code}
                          </span>
                          <div className="h-px w-full bg-white/10 my-1" />
                          <span className="text-slate-400 text-[10px]">Custo base estimado</span>
                          <span className="text-emerald-400 font-mono font-medium text-sm block">
                            ${baseTotal.toLocaleString()}<span className="text-[10px] text-slate-400 font-sans ml-1">/mês</span>
                          </span>
                        </div>
                      </foreignObject>
                    )}
                  </Marker>
                );
              })}
            </ComposableMap>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
