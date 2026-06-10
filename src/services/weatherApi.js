/**
 * Simple wrapper around OpenWeatherMap current weather endpoint.
 * Returns JSON data for the given city.
 */
export async function fetchWeather(city) {
  const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
      city
    )}&units=metric&appid=${apiKey}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch weather data');
  }
  return response.json();
}
