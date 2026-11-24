$(function () {
    const keys = { theme: "jslab-exp12-theme", unit: "jslab-exp12-unit", history: "jslab-exp12-history", sessionCity: "jslab-exp12-last-city" };
    const weatherCodes = {
        0: ["Clear sky", "☀️"], 1: ["Mainly clear", "🌤️"], 2: ["Partly cloudy", "⛅"], 3: ["Overcast", "☁️"],
        45: ["Fog", "🌫️"], 48: ["Rime fog", "🌫️"], 51: ["Light drizzle", "🌦️"], 53: ["Drizzle", "🌦️"], 55: ["Heavy drizzle", "🌧️"],
        61: ["Light rain", "🌧️"], 63: ["Rain", "🌧️"], 65: ["Heavy rain", "🌧️"], 71: ["Light snow", "🌨️"], 73: ["Snow", "🌨️"], 75: ["Heavy snow", "❄️"],
        80: ["Rain showers", "🌦️"], 81: ["Showers", "🌧️"], 82: ["Heavy showers", "⛈️"], 95: ["Thunderstorm", "⛈️"], 96: ["Thunderstorm with hail", "⛈️"], 99: ["Severe thunderstorm", "⛈️"]
    };
    let currentLocation = null;
    let lastWeather = null;
    let unit = localStorage.getItem(keys.unit) || "C";

    function readHistory() {
        try { return JSON.parse(localStorage.getItem(keys.history) || "[]").filter((name) => typeof name === "string"); }
        catch { return []; }
    }

    function setStatus(message, error = false) {
        $("#status").text(message).toggleClass("error", error);
    }

    function renderHistory() {
        const history = readHistory();
        $("#historyCount").text(history.length);
        const container = $("#history").empty();
        if (!history.length) {
            container.append($('<span class="empty">Your recent cities will appear here.</span>'));
            return;
        }
        history.forEach((city) => container.append($("<button>").attr("type", "button").attr("data-city", city).text(city)));
    }

    function rememberCity(city) {
        const updated = [city, ...readHistory().filter((item) => item.toLowerCase() !== city.toLowerCase())].slice(0, 6);
        localStorage.setItem(keys.history, JSON.stringify(updated));
        sessionStorage.setItem(keys.sessionCity, city);
        $("#sessionInfo").text(`Current tab session: last searched city is ${city}.`);
        renderHistory();
    }

    function displayTemp(celsius) {
        const value = unit === "F" ? celsius * 9 / 5 + 32 : celsius;
        return `${Math.round(value)}°${unit}`;
    }

    function describeWeather(code) {
        return weatherCodes[code] || ["Conditions unavailable", "🌡️"];
    }

    function showWeather(data) {
        lastWeather = data;
        const current = data.current;
        const daily = data.daily;
        const [condition, icon] = describeWeather(current.weather_code);
        $("#conditionName").text(condition);
        $("#conditionDetail").text(current.is_day ? "Clear daylight conditions" : "Nighttime conditions");
        $("#weatherIcon").text(icon);
        $("#temperature").text(Math.round(unit === "F" ? current.temperature_2m * 9 / 5 + 32 : current.temperature_2m));
        $("#temperatureUnit").text(unit === "F" ? "°F" : "°C");
        $("#highLow").text(`↑ H: ${displayTemp(daily.temperature_2m_max[0])} · ↓ L: ${displayTemp(daily.temperature_2m_min[0])}`);
        $("#feelsLike").text(displayTemp(current.apparent_temperature));
        $("#humidity").text(`${current.relative_humidity_2m}%`);
        $("#windSpeed").text(`${Math.round(current.wind_speed_10m)} km/h`);
        $("#pressure").text(`${Math.round(current.surface_pressure)} hPa`);
        $("#coordinates").text(`${currentLocation.latitude.toFixed(2)}°, ${currentLocation.longitude.toFixed(2)}°`);
        $("#daylight").text(current.is_day ? "Daytime" : "Nighttime");
        $("#updatedAt").text(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
        $("#timezone").text(data.timezone || "Local time");
        setStatus("Weather data loaded from Open-Meteo using jQuery AJAX.");
    }

    function loadWeather(location) {
        setStatus(`Loading current weather for ${location.name}…`);
        $.ajax({
            url: "https://api.open-meteo.com/v1/forecast",
            method: "GET",
            dataType: "json",
            data: {
                latitude: location.latitude,
                longitude: location.longitude,
                current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,surface_pressure",
                daily: "temperature_2m_max,temperature_2m_min",
                timezone: "auto",
                forecast_days: 1
            }
        }).done(showWeather).fail(() => setStatus("Weather request failed. Check your internet connection and try again.", true));
    }

    function searchCity(value) {
        const query = value.trim();
        if (!query) return;
        $("#cityInput").val(query);
        setStatus(`Finding ${query}…`);
        $.ajax({
            url: "https://geocoding-api.open-meteo.com/v1/search",
            method: "GET",
            dataType: "json",
            data: { name: query, count: 1, language: "en", format: "json" }
        }).done((result) => {
            const place = result.results && result.results[0];
            if (!place) {
                setStatus(`No matching city found for “${query}”.`, true);
                return;
            }
            currentLocation = { name: place.name, countryCode: place.country_code || "", latitude: place.latitude, longitude: place.longitude };
            $("#cityName").text(place.name);
            $("#countryCode").text(place.country_code || "");
            rememberCity(place.name);
            loadWeather(currentLocation);
        }).fail(() => setStatus("City lookup failed. Check your internet connection and try again.", true));
    }

    $("#searchForm").on("submit", function (event) {
        event.preventDefault();
        searchCity($("#cityInput").val());
    });
    $(".popular").on("click", "button[data-city]", function () { searchCity($(this).data("city")); });
    $("#history").on("click", "button[data-city]", function () { searchCity($(this).data("city")); });
    $("#refreshButton").on("click", function () {
        if (currentLocation) loadWeather(currentLocation);
        else searchCity($("#cityInput").val() || "Mumbai");
    });
    $("#unitButton").on("click", function () {
        unit = unit === "C" ? "F" : "C";
        localStorage.setItem(keys.unit, unit);
        if (lastWeather) showWeather(lastWeather);
    });
    $("#themeButton").on("click", function () {
        const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        document.documentElement.dataset.theme = theme;
        localStorage.setItem(keys.theme, theme);
    });
    $("#clearHistory").on("click", function () {
        localStorage.removeItem(keys.history);
        renderHistory();
        setStatus("Recent search history cleared.");
    });

    document.documentElement.dataset.theme = localStorage.getItem(keys.theme) || "dark";
    renderHistory();
    const priorCity = sessionStorage.getItem(keys.sessionCity) || "Mumbai";
    $("#cityInput").val(priorCity);
    searchCity(priorCity);
    window.setInterval(() => {
        $("#clock").text(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" }));
    }, 1000);
    window.setInterval(() => { if (currentLocation) loadWeather(currentLocation); }, 10 * 60 * 1000);
});
