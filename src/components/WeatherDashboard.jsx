import { useState, useEffect, useCallback } from 'react'
import { fetchWeather } from '../services/weatherApi'
import './WeatherDashboard.css'

const DEFAULT_CITIES = ['Jakarta', 'Surabaya', 'Bandung', 'Bali']

function getWeatherGradient(weatherId) {
  if (!weatherId) return ['#1a1a2e', '#16213e', '#0f3460']
  if (weatherId < 300) return ['#1a0a2e', '#2d1b69', '#4a2090'] // Thunderstorm
  if (weatherId < 500) return ['#0d1b2a', '#1b2a4a', '#2a4a6b'] // Drizzle
  if (weatherId < 600) return ['#0a1628', '#142241', '#1e3459'] // Rain
  if (weatherId < 700) return ['#e8f4f8', '#c8e6f0', '#a8d8e8'] // Snow
  if (weatherId < 800) return ['#1a1a1a', '#2a2a2a', '#3a3a3a'] // Fog/Mist
  if (weatherId === 800) return ['#0a1628', '#0f4c81', '#1a7abf'] // Clear sky
  return ['#1a1f3a', '#1e2d4a', '#253a5e'] // Cloudy
}

function formatTime(timezone) {
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  const local = new Date(utc + timezone * 1000)
  return local.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function formatDate() {
  return new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
}

const weatherTranslate = {
  'clear sky': 'Cerah',
  'few clouds': 'Sedikit Berawan',
  'scattered clouds': 'Berawan',
  'broken clouds': 'Berawan Sebagian',
  'overcast clouds': 'Mendung',
  'light rain': 'Hujan Ringan',
  'moderate rain': 'Hujan Sedang',
  'heavy intensity rain': 'Hujan Deras',
  'thunderstorm': 'Badai Petir',
  'snow': 'Bersalju',
  'mist': 'Berkabut',
  'haze': 'Kabut Asap',
  'fog': 'Kabut',
  'drizzle': 'Gerimis',
}

function translateWeather(desc) {
  return weatherTranslate[desc?.toLowerCase()] ?? desc
}

export default function WeatherDashboard() {
  const [city, setCity] = useState('Jakarta')
  const [searchInput, setSearchInput] = useState('')
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [time, setTime] = useState('')
  const [animate, setAnimate] = useState(false)

  const loadWeather = useCallback(async (targetCity) => {
    setLoading(true)
    setError(null)
    setAnimate(false)
    try {
      const data = await fetchWeather(targetCity)
      setWeather(data)
      setTimeout(() => setAnimate(true), 50)
    } catch (e) {
      setError('Kota tidak ditemukan atau terjadi kesalahan jaringan.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadWeather(city)
  }, [city, loadWeather])

  useEffect(() => {
    if (!weather) return
    const tick = () => setTime(formatTime(weather.timezone))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [weather])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchInput.trim()) {
      setCity(searchInput.trim())
      setSearchInput('')
    }
  }

  const gradients = weather ? getWeatherGradient(weather.weather[0]?.id) : ['#0a0e1a', '#111827', '#1f2937']
  const bgStyle = {
    background: `radial-gradient(ellipse at top left, ${gradients[0]} 0%, ${gradients[1]} 50%, ${gradients[2]} 100%)`,
  }

  const w = weather
  const temp = w ? Math.round(w.main.temp) : null
  const feelsLike = w ? Math.round(w.main.feels_like) : null
  const iconCode = w?.weather[0]?.icon
  const iconUrl = iconCode ? `https://openweathermap.org/img/wn/${iconCode}@4x.png` : null
  const description = w ? translateWeather(w.weather[0]?.description) : ''

  return (
    <div className="dashboard" style={bgStyle}>
      {/* Animated background orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className={`dashboard-content ${animate ? 'visible' : ''}`}>
        {/* Header */}
        <header className="header">
          <div className="header-brand">
            <span className="brand-icon">🌤</span>
            <span className="brand-name">Pantauan Cuaca</span>
          </div>
          <form className="search-form" onSubmit={handleSearch} role="search">
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                id="city-search"
                type="text"
                placeholder="Cari kota..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="search-input"
                autoComplete="off"
                aria-label="Cari kota"
              />
              <button type="submit" className="search-btn" aria-label="Cari">Cari</button>
            </div>
          </form>
        </header>

        {/* Quick city chips */}
        <div className="city-chips">
          {DEFAULT_CITIES.map((c) => (
            <button
              key={c}
              className={`city-chip ${city === c ? 'active' : ''}`}
              onClick={() => setCity(c)}
              type="button"
            >
              {c}
            </button>
          ))}
        </div>

        {/* Main content */}
        {loading && (
          <div className="state-box">
            <div className="spinner" />
            <p>Memuat data cuaca…</p>
          </div>
        )}

        {error && !loading && (
          <div className="state-box error-state">
            <span className="state-icon">⚠️</span>
            <p>{error}</p>
            <button className="retry-btn" onClick={() => loadWeather(city)}>Coba Lagi</button>
          </div>
        )}

        {w && !loading && !error && (
          <main className="main-grid">
            {/* Primary card */}
            <section className="card primary-card" aria-label="Cuaca utama">
              <div className="primary-top">
                <div className="location-info">
                  <h1 className="city-title">{w.name}</h1>
                  <p className="country">{w.sys.country} · {time}</p>
                  <p className="date">{formatDate()}</p>
                </div>
                <div className="weather-icon-wrap">
                  {iconUrl && <img src={iconUrl} alt={description} className="weather-icon-lg" />}
                </div>
              </div>
              <div className="primary-bottom">
                <div className="temp-display">
                  <span className="temp-value">{temp}</span>
                  <span className="temp-unit">°C</span>
                </div>
                <div className="desc-wrap">
                  <p className="weather-desc">{description}</p>
                  <p className="feels-like">Terasa seperti {feelsLike}°C</p>
                </div>
              </div>
            </section>

            {/* Stats grid */}
            <div className="stats-grid">
              <StatCard icon="💧" label="Kelembaban" value={`${w.main.humidity}%`} />
              <StatCard icon="🌬" label="Angin" value={`${Math.round(w.wind.speed * 3.6)} km/h`} />
              <StatCard icon="👁" label="Jarak Pandang" value={`${(w.visibility / 1000).toFixed(1)} km`} />
              <StatCard icon="🌡" label="Tekanan" value={`${w.main.pressure} hPa`} />
              <StatCard icon="⬆" label="Suhu Maks" value={`${Math.round(w.main.temp_max)}°C`} />
              <StatCard icon="⬇" label="Suhu Min" value={`${Math.round(w.main.temp_min)}°C`} />
            </div>

            {/* Sun card */}
            <section className="card sun-card" aria-label="Matahari terbit & terbenam">
              <h2 className="card-title">☀️ Matahari</h2>
              <div className="sun-row">
                <div className="sun-item">
                  <span className="sun-icon">🌅</span>
                  <span className="sun-label">Terbit</span>
                  <span className="sun-time">
                    {new Date(w.sys.sunrise * 1000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="sun-divider" />
                <div className="sun-item">
                  <span className="sun-icon">🌇</span>
                  <span className="sun-label">Terbenam</span>
                  <span className="sun-time">
                    {new Date(w.sys.sunset * 1000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </section>
          </main>
        )}

        <footer className="footer">
          <p>Data dari <a href="https://openweathermap.org" target="_blank" rel="noreferrer">OpenWeatherMap</a> · Diperbarui setiap 10 menit</p>
        </footer>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }) {
  return (
    <div className="card stat-card">
      <span className="stat-icon">{icon}</span>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  )
}
