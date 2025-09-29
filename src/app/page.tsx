"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";

interface CurrentWeather {
  name: string;
  sys: { country: string; sunrise: number; sunset: number };
  main: { temp: number; feels_like: number; humidity: number; pressure: number };
  visibility: number;
  wind: { speed: number };
  weather: { description: string; icon: string }[];
}

interface ForecastItem {
  dt: number;
  main: { temp: number; temp_min: number; temp_max: number };
  weather: { description: string; icon: string }[];
}

export default function Home() {
  const [city, setCity] = useState("Jhelum");
  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<ForecastItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchWeather = async (searchCity: string) => {
    try {
      setError("");
      setLoading(true);

      // current weather
      const currentRes = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${searchCity}&appid=${process.env.NEXT_PUBLIC_WEATHER_API_KEY}&units=metric`
      );
      setCurrent(currentRes.data);

      // forecast
      const forecastRes = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?q=${searchCity}&appid=${process.env.NEXT_PUBLIC_WEATHER_API_KEY}&units=metric`
      );
      setForecast(forecastRes.data.list);
      
    }
    catch (err) {
      setError("City not found"+ err);
      setCurrent(null); 
      setForecast([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather("Jhelum");
  }, []);

  const formatTime = (unix: number) =>
    new Date(unix * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formatDate = (unix: number) =>
    new Date(unix * 1000).toLocaleDateString([], { weekday: "short" });
  
  // Group forecast by day (for daily forecast)
  const dailyForecast = Object.values(
    forecast.reduce((acc: any, item) => {
      const date = new Date(item.dt * 1000).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = { ...item, temp_min: item.main.temp_min, temp_max: item.main.temp_max };
      } else {
        acc[date].temp_min = Math.min(acc[date].temp_min, item.main.temp_min);
        acc[date].temp_max = Math.max(acc[date].temp_max, item.main.temp_max);
      }
      return acc;
    }, {})
  )

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-300 to-indigo-900 text-white flex flex-col">
      <div className="min-h-screen w-full bg-black/30 flex flex-col">
        {/* Navbar */}
        <nav className="flex justify-between items-center px-8 py-4 bg-white/10 backdrop-blur-lg shadow-md">
          <h1 className="text-2xl font-bold">🌤 Weather</h1>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter city..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="px-4 py-2 rounded-md outline-blue-500 outline focus:outline-white text-white"
            />
            <button
              onClick={() => fetchWeather(city)}
              disabled={loading || !city.trim()}
              className={`px-4 py-2 rounded-md font-semibold transition cursor-pointer ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 text-black hover:bg-blue-600"
              }`}
            >
              {loading ? "..." : "Search"}
            </button>
          </div>
        </nav>

        {/* Main Weather Section */}
        <section className="container mx-auto px-8 py-10">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : current ? (
            <>
              {/* Current */}
              <div className="flex items-center justify-between bg-white/20 p-6 rounded-3xl shadow-lg">
                <div>
                  <h2 className="text-5xl font-bold">
                    {Math.round(current.main.temp)}°C
                  </h2>
                  <p>{current.name}, {current.sys.country}</p>

                  <p className="capitalize">{current.weather[0].description}</p>
                  <p className="text-sm">
                    Feels like {Math.round(current.main.feels_like)}°C
                  </p>
                  <p className="text-sm">
                    💧 {current.main.humidity}% | 🌬 {current.wind.speed} m/s
                  </p>
                  <p className="text-sm">Pressure: {current.main.pressure} hPa</p>
                  <p className="text-sm">Visibility: {current.visibility / 1000} km</p>
                  <p className="text-sm">
                    🌅 {formatTime(current.sys.sunrise)} | 🌇 {formatTime(current.sys.sunset)}
                  </p>
                </div>
                <Image
                  src={`https://openweathermap.org/img/wn/${current.weather[0].icon}@4x.png`}
                  alt="icon"
                  className="w-40 h-40"
                  height={40}
                  width={40}
                />
              </div>

              {/* Hourly Forecast */}
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-3">Next Hours</h3>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {forecast.slice(0, 6).map((h, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center bg-white/20 p-3 rounded-xl w-20"
                    >
                      <p className="text-sm">
                        {new Date(h.dt * 1000).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <Image
                  src={`https://openweathermap.org/img/wn/${h.weather[0].icon}.png`}
                  alt="icon"
                  className="w-12 h-12"
                  height={40}
                  width={40}
                />
                      <p>{Math.round(h.main.temp)}°</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5-Day Forecast */}
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-3">5-Day Forecast</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {dailyForecast.map((d:any, i) => (
                    <div
                      key={i}
                      className="bg-white/20 p-4 rounded-xl flex flex-col items-center"
                    >
                      <p>{formatDate(d.dt)}</p>
                          <Image
                  src={`https://openweathermap.org/img/wn/${d.weather[0].icon}.png`}
                  alt="icon"
                  className="w-12 h-12"
                  height={12}
                  width={12}
                />
                      <p className="text-sm capitalize">{d.weather[0].description}</p>
                      <p className="text-sm">
                        {Math.round(d.temp_max)}° / {Math.round(d.temp_min)}°
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            error && <p className="text-red-300">{error}</p>
          )}
        </section>
      </div>
    </main>
  );
}
