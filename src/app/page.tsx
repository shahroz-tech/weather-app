"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";


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
  const [city, setCity] = useState("");
  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<ForecastItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [cordinates, setCordinates] = useState({})
  const [allCities, setAllCities] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [unit, setUnit] = useState<"C" | "F">("C");



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
      setError("City not found" + err);
      setCurrent(null);
      setForecast([]);
    } finally {
      setLoading(false);
    }
  };

  //fetch weather by coordinates
  const fetchWeatherByCordiantes = async () => {

    try {
      setError("");
      // setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          // current weather
          const currentRes = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${position.coords.latitude}&lon=${position.coords.longitude}&appid=${process.env.NEXT_PUBLIC_WEATHER_API_KEY}&units=metric`
          );
          setCurrent(currentRes.data);

          // forecast
          const forecastRes = await axios.get(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${position.coords.latitude}&lon=${position.coords.longitude}&appid=${process.env.NEXT_PUBLIC_WEATHER_API_KEY}&units=metric`
          );
          setForecast(forecastRes.data.list);
        },
        (error) => console.error(error)
      );


    }
    catch (err) {
      setError("City not found" + err);
      setCurrent(null);
      setForecast([]);
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    fetchWeatherByCordiantes();
    fetchCitiesOfPakistan();
  }, []);


  //------------------------------search suggestion--------------------

  //fetch cities of Pakistan
  async function fetchCitiesOfPakistan() {
    const url = `http://api.geonames.org/searchJSON?country=PK&featureClass=P&maxRows=1000&username=shahroz`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      const cities = data.geonames.map((city: any) => city.name);

      console.log("Total Cities:", cities.length);
      console.log(cities);

      setAllCities(cities); // ✅ save to state
      return cities;
    } catch (error) {
      console.error("Error fetching cities:", error);
      return [];
    }
  }

  // update suggestions when user types
  useEffect(() => {
    if (city.trim()) {
      const filtered = allCities
        .filter((c) => c.toLowerCase().startsWith(city.toLowerCase()))
        .slice(0, 10);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [city, allCities]);

  //------------------------------search suggestion--------------------

  const convertTemp = (tempC: number) => {
    return unit === "C" ? tempC : (tempC * 9) / 5 + 32;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-600 via-blue-500 to-cyan-400 text-white flex flex-col">
      <div className="min-h-screen w-full bg-black/30 backdrop-blur-md flex flex-col">

        {/* Navbar */}
        <nav className="flex justify-between items-center px-6 py-4 bg-white/10 backdrop-blur-lg sticky top-0 z-50 shadow-lg">
          <h1 className="text-2xl font-extrabold tracking-wide">🌤 WeatherNow</h1>


          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Search city..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-5 py-2.5 rounded-full bg-white/20 text-white placeholder-gray-200 outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={() => fetchWeather(city)}
              disabled={loading || !city.trim()}
              className={`absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-full font-semibold transition 
            ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600 text-black"}`}
            >
              {loading ? "..." : "Go"}
            </button>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <ul className="absolute mt-2 w-full bg-white/80 backdrop-blur-md text-gray-900 
                rounded-xl shadow-xl max-h-56 overflow-y-auto z-20 border border-gray-200">
                {suggestions.map((s, i) => (
                  <li
                    key={i}
                    onClick={() => {
                      setCity(s);
                      fetchWeather(s).finally(() => setSuggestions([]));
                    }}
                    className="px-4 py-2 hover:bg-blue-100 hover:text-blue-900 cursor-pointer transition-all duration-200
                   first:rounded-t-xl last:rounded-b-xl"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}

          </div>
        </nav>

        {/* Weather Content */}
        <section className="container mx-auto px-6 py-10">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-14 h-14 border-4 border-white/40 border-t-blue-400 rounded-full animate-spin"></div>
            </div>
          ) : current ? (
            <>
              {/* Current Weather Card */}
              <div className="flex flex-col md:flex-row items-center justify-between bg-white/20 backdrop-blur-lg p-6 rounded-3xl shadow-xl transition hover:scale-[1.02]">
                <div className="space-y-2">
                  <div className="flex items-baseline-last">
                    <h2 className="text-6xl font-bold">
                      {Math.round(convertTemp(current.main.temp))}°{unit}
                    </h2>
                    <button
                      onClick={() => setUnit(unit === "C" ? "F" : "C")}
                      className="ml-4 px-4 py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-black font-semibold transition"
                    >
                      {unit === "C" ? "°F" : "°C"}
                    </button>
                  </div>


                  <p className="text-xl font-semibold">{current.name}, {current.sys.country}</p>
                  <p className="capitalize">{current.weather[0].description}</p>
                  <p className="text-sm opacity-80">
                    Feels like {Math.round(convertTemp(current.main.feels_like))}°{unit}
                  </p>

                  <p className="text-sm opacity-80">💧 {current.main.humidity}% | 🌬 {current.wind.speed} m/s</p>
                  <p className="text-sm opacity-80">Pressure: {current.main.pressure} hPa</p>
                  <p className="text-sm opacity-80">Visibility: {current.visibility / 1000} km</p>
                  <p className="text-sm opacity-80">
                    🌅 {formatTime(current.sys.sunrise)} | 🌇 {formatTime(current.sys.sunset)}
                  </p>
                </div>
                <Image
                  src={`https://openweathermap.org/img/wn/${current.weather[0].icon}@4x.png`}
                  alt="icon"
                  className="w-40 h-40 drop-shadow-lg"
                  height={40}
                  width={40}
                />
              </div>

              {/* Hourly Forecast */}
              <div className="mt-10">
                <h3 className="text-xl font-bold mb-4">Next Hours</h3>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {forecast.slice(0, 6).map((h, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center bg-white/20 backdrop-blur-md p-4 rounded-2xl min-w-[90px] transition hover:bg-white/30"
                    >
                      <p className="text-sm">
                        {new Date(h.dt * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <Image
                        src={`https://openweathermap.org/img/wn/${h.weather[0].icon}.png`}
                        alt="icon"
                        className="w-12 h-12"
                        height={40}
                        width={40}
                      />
                      <p className="text-lg font-semibold">
                        {Math.round(convertTemp(h.main.temp))}°{unit}
                      </p>

                    </div>
                  ))}
                </div>
              </div>

              {/* Line Graph */}
              <div className="w-full h-64 mt-6 bg-white/20 backdrop-blur-md rounded-2xl p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={forecast.slice(0, 8).map((h) => ({
                      time: new Date(h.dt * 1000).toLocaleTimeString([], { hour: "2-digit" }),
                      temp: Math.round(h.main.temp),
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                    <XAxis dataKey="time" stroke="#fff" />
                    <YAxis stroke="#fff" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "black",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="temp"
                      stroke="#60a5fa"
                      strokeWidth={3}
                      dot={{ r: 5, fill: "#2563eb" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* 5-Day Forecast */}
              <div className="mt-10">
                <h3 className="text-xl font-bold mb-4">5-Day Forecast</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {dailyForecast.map((d: any, i) => (
                    <div
                      key={i}
                      className="bg-white/20 backdrop-blur-md p-4 rounded-2xl flex flex-col items-center text-center transition hover:bg-white/30"
                    >
                      <p className="font-medium">{formatDate(d.dt)}</p>
                      <Image
                        src={`https://openweathermap.org/img/wn/${d.weather[0].icon}.png`}
                        alt="icon"
                        className="w-12 h-12"
                        height={40}
                        width={40}
                      />
                      <p className="text-sm capitalize">{d.weather[0].description}</p>
                      <p className="font-semibold">
                        {Math.round(convertTemp(d.temp_max))}° / {Math.round(convertTemp(d.temp_min))}°{unit}
                      </p>

                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            error && <p className="text-red-300 text-center text-lg">{error}</p>
          )}
        </section>
      </div>
    </main >

  );
}
