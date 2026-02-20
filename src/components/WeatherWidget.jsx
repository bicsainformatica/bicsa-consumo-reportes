import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Wind } from 'lucide-react';

const WeatherWidget = ({ city = 'Asunción,PY' }) => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tu API Key intacta
  const API_KEY = '7bb6d01ce031edf45df7f3295fd8b3ef';

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}&lang=es`
        );

        if (!response.ok) {
          throw new Error('Ciudad no encontrada');
        }

        const data = await response.json();
        setWeatherData(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [city]);

  const getWeatherIcon = (weatherCode) => {
    if (weatherCode >= 200 && weatherCode < 600) return <CloudRain className="w-6 h-6 text-blue-500" />;
    if (weatherCode >= 600 && weatherCode < 700) return <Cloud className="w-6 h-6 text-slate-400" />;
    if (weatherCode === 800) return <Sun className="w-6 h-6 text-amber-500 animate-pulse" />;
    return <Cloud className="w-6 h-6 text-blue-400" />;
  };

  // Skeleton de carga reducido
  if (loading) {
    return (
      <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-sm px-3 py-1.5 flex items-center space-x-3 w-max animate-pulse">
        <div className="w-6 h-6 bg-slate-200 rounded-full"></div>
        <div className="flex flex-col space-y-1">
          <div className="h-3 bg-slate-200 rounded w-16"></div>
          <div className="h-2 bg-slate-200 rounded w-12"></div>
        </div>
      </div>
    );
  }

  // Error reducido
  if (error) {
    return (
      <div className="bg-red-50/90 backdrop-blur-md rounded-xl shadow-sm px-3 py-1.5 border border-red-100 w-max">
        <p className="text-xs text-red-600 flex items-center font-medium m-0">
          <Wind className="w-3 h-3 mr-1" />
          Error clima
        </p>
      </div>
    );
  }

  if (!weatherData) return null;

  const { name, weather } = weatherData;
  const temperature = Math.round(weatherData.main.temp);
  const description = weather[0].description;

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-sm hover:shadow-md transition-all duration-300 px-3 py-1.5 flex items-center space-x-3 w-max border border-white/20">
      
      {/* Ícono y Ciudad */}
      <div className="flex items-center space-x-2">
        <div className="p-1 bg-slate-50 rounded-full">
          {getWeatherIcon(weather[0].id)}
        </div>
        <div className="flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-800 leading-tight">
            {name}
          </span>
          <span className="text-[10px] text-slate-500 font-medium capitalize leading-tight">
            {description}
          </span>
        </div>
      </div>

      {/* Temperatura con borde separador */}
      <div className="flex items-start pl-3 border-l border-slate-200/80">
        <span className="text-xl font-extrabold text-blue-600 leading-none">
          {temperature}
        </span>
        <span className="text-xs text-blue-500 font-bold ml-0.5 mt-0.5">
          °C
        </span>
      </div>

    </div>
  );
};

export default WeatherWidget;