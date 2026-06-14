"""
Weather Data Layer
Multi-model ensemble forecasting via Open-Meteo (free)
GFS 31-member + ECMWF IFS + HRRR + NBM
"""
import asyncio
from typing import Optional
import httpx
import numpy as np
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential

OPEN_METEO_FORECAST  = "https://api.open-meteo.com/v1/forecast"
OPEN_METEO_ENSEMBLE  = "https://ensemble-api.open-meteo.com/v1/ensemble"
OPEN_METEO_HISTORICAL = "https://archive-api.open-meteo.com/v1/archive"
NOAA_NWS_API         = "https://api.weather.gov"

# City coordinates database
CITY_COORDS = {
    "New York":       (40.7128, -74.0060),
    "Los Angeles":    (34.0522, -118.2437),
    "Chicago":        (41.8781, -87.6298),
    "Miami":          (25.7617, -80.1918),
    "Houston":        (29.7604, -95.3698),
    "Phoenix":        (33.4484, -112.0740),
    "Dallas":         (32.7767, -96.7970),
    "Atlanta":        (33.7490, -84.3880),
    "Seattle":        (47.6062, -122.3321),
    "Denver":         (39.7392, -104.9903),
    "Las Vegas":      (36.1699, -115.1398),
    "Boston":         (42.3601, -71.0589),
    "San Francisco":  (37.7749, -122.4194),
    "Portland":       (45.5051, -122.6750),
    "Minneapolis":    (44.9778, -93.2650),
    "Detroit":        (42.3314, -83.0457),
    "Philadelphia":   (39.9526, -75.1652),
    "Washington":     (38.9072, -77.0369),
    "Nashville":      (36.1627, -86.7816),
    "Austin":         (30.2672, -97.7431),
    "London":         (51.5074, -0.1278),
    "Tokyo":          (35.6762, 139.6503),
    "Paris":          (48.8566, 2.3522),
    "Sydney":         (-33.8688, 151.2093),
    "Toronto":        (43.6532, -79.3832),
    "Dubai":          (25.2048, 55.2708),
    "Singapore":      (1.3521, 103.8198),
}


class WeatherEnsemble:
    """
    Multi-model ensemble forecasting.
    Core probability engine for the trading strategy.
    """

    def __init__(self):
        self.session = httpx.AsyncClient(timeout=30)

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=10))
    async def get_gfs_ensemble(
        self,
        lat: float,
        lon: float,
        forecast_days: int = 7,
    ) -> dict:
        """
        Fetch 31-member GFS ensemble from Open-Meteo.
        Returns per-member temperature_2m forecasts.
        """
        params = {
            "latitude": lat,
            "longitude": lon,
            "models": "gfs_seamless",
            "hourly": "temperature_2m",
            "forecast_days": forecast_days,
            "temperature_unit": "fahrenheit",
            "wind_speed_unit": "mph",
            "precipitation_unit": "inch",
            "timezone": "auto",
        }
        resp = await self.session.get(OPEN_METEO_ENSEMBLE, params=params)
        resp.raise_for_status()
        return resp.json()

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=10))
    async def get_ecmwf_forecast(
        self,
        lat: float,
        lon: float,
        forecast_days: int = 10,
    ) -> dict:
        """
        Fetch ECMWF IFS 9km deterministic forecast (open-data since Oct 2025).
        """
        params = {
            "latitude": lat,
            "longitude": lon,
            "models": "ecmwf_ifs_analysis_long_window",
            "hourly": "temperature_2m,precipitation,wind_speed_10m",
            "forecast_days": forecast_days,
            "temperature_unit": "fahrenheit",
            "timezone": "auto",
        }
        resp = await self.session.get(OPEN_METEO_FORECAST, params=params)
        resp.raise_for_status()
        return resp.json()

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=10))
    async def get_multi_model_forecast(
        self,
        lat: float,
        lon: float,
        forecast_days: int = 7,
    ) -> dict:
        """
        Fetch best-match + multiple models for consensus building.
        """
        params = {
            "latitude": lat,
            "longitude": lon,
            "models": "best_match,gfs_seamless,ecmwf_ifs_analysis_long_window",
            "hourly": "temperature_2m,precipitation_probability,precipitation,wind_speed_10m",
            "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max",
            "forecast_days": forecast_days,
            "temperature_unit": "fahrenheit",
            "timezone": "auto",
        }
        resp = await self.session.get(OPEN_METEO_FORECAST, params=params)
        resp.raise_for_status()
        return resp.json()

    async def compute_threshold_probability(
        self,
        city: str,
        threshold_f: float,
        direction: str = "above",  # "above" | "below"
        target_date: Optional[str] = None,
        market_type: str = "temperature",
    ) -> dict:
        """
        Core function: estimate P(temperature exceeds threshold) for a city/date.

        Returns:
            {
                "model_prob": 0.74,
                "ensemble_members": 31,
                "members_hitting": 23,
                "model_mean_f": 82.3,
                "model_spread": 4.2,
                "confidence": "high",  # high|medium|low
                "models_used": ["gfs", "ecmwf"],
                "city": "Miami",
                "threshold_f": 90.0,
            }
        """
        coords = CITY_COORDS.get(city)
        if not coords:
            logger.warning(f"City '{city}' not in database, using default")
            coords = (40.7128, -74.0060)  # default NYC

        lat, lon = coords
        probs = []
        members_data = []

        # --- GFS Ensemble (31 members) ---
        try:
            gfs_data = await self.get_gfs_ensemble(lat, lon)
            gfs_prob, gfs_members, gfs_mean = self._ensemble_threshold_prob(
                gfs_data, threshold_f, direction, target_date
            )
            if gfs_prob is not None:
                probs.append(("gfs_ensemble", gfs_prob, 31))
                members_data.extend(gfs_members)
                logger.debug(f"[GFS] {city} prob={gfs_prob:.3f} mean={gfs_mean:.1f}°F")
        except Exception as e:
            logger.warning(f"[GFS] failed for {city}: {e}")

        # --- ECMWF Deterministic ---
        try:
            ecmwf_data = await self.get_ecmwf_forecast(lat, lon)
            ecmwf_prob = self._deterministic_threshold_prob(
                ecmwf_data, threshold_f, direction, target_date
            )
            if ecmwf_prob is not None:
                probs.append(("ecmwf", ecmwf_prob, 1))
                logger.debug(f"[ECMWF] {city} prob={ecmwf_prob:.3f}")
        except Exception as e:
            logger.warning(f"[ECMWF] failed for {city}: {e}")

        # --- Multi-model best_match ---
        try:
            mm_data = await self.get_multi_model_forecast(lat, lon)
            mm_prob = self._deterministic_threshold_prob(
                mm_data, threshold_f, direction, target_date
            )
            if mm_prob is not None:
                probs.append(("best_match", mm_prob, 1))
        except Exception as e:
            logger.warning(f"[MultiModel] failed for {city}: {e}")

        if not probs:
            return {"model_prob": None, "error": "all weather APIs failed"}

        # --- Weighted ensemble average ---
        # GFS ensemble gets 3x weight, ECMWF 2x, best_match 1x
        weights = {"gfs_ensemble": 3.0, "ecmwf": 2.0, "best_match": 1.0}
        total_weight = sum(weights.get(name, 1) for name, _, _ in probs)
        model_prob = sum(weights.get(name, 1) * p for name, p, _ in probs) / total_weight

        # Spread of members for confidence
        if members_data:
            spread = float(np.std(members_data))
            members_hitting = sum(1 for v in members_data if (v > threshold_f if direction == "above" else v < threshold_f))
            total_members = len(members_data)
        else:
            spread = 0.0
            members_hitting = 0
            total_members = 1

        # Confidence: low spread + high/low prob = high confidence
        edge_from_50 = abs(model_prob - 0.5)
        if spread < 3 and edge_from_50 > 0.25:
            confidence = "high"
        elif spread < 6 and edge_from_50 > 0.1:
            confidence = "medium"
        else:
            confidence = "low"

        return {
            "model_prob": round(model_prob, 4),
            "ensemble_members": total_members or 31,
            "members_hitting": members_hitting,
            "model_spread_f": round(spread, 2),
            "model_mean_f": round(float(np.mean(members_data)) if members_data else 0, 1),
            "confidence": confidence,
            "models_used": [name for name, _, _ in probs],
            "city": city,
            "threshold_f": threshold_f,
            "direction": direction,
        }

    def _ensemble_threshold_prob(
        self,
        data: dict,
        threshold_f: float,
        direction: str,
        target_date: Optional[str],
    ) -> tuple[Optional[float], list[float], float]:
        """Extract daily max from ensemble members and compute P(threshold)."""
        hourly = data.get("hourly", {})
        times = hourly.get("time", [])

        # Collect all member temperature columns
        member_keys = [k for k in hourly if k.startswith("temperature_2m_member")]
        if not member_keys:
            # Fall back to single temperature_2m
            temp_key = "temperature_2m"
            if temp_key not in hourly:
                return None, [], 0.0
            member_keys = [temp_key]

        member_maxes = []
        for key in member_keys:
            values = hourly.get(key, [])
            if not values:
                continue
            # Filter to target date if specified
            if target_date:
                day_values = [
                    v for t, v in zip(times, values)
                    if t and t.startswith(target_date) and v is not None
                ]
            else:
                # Use tomorrow's values (next 24h)
                day_values = [v for v in values[:24] if v is not None]
            if day_values:
                member_maxes.append(max(day_values))

        if not member_maxes:
            return None, [], 0.0

        if direction == "above":
            hitting = sum(1 for v in member_maxes if v > threshold_f)
        else:
            hitting = sum(1 for v in member_maxes if v < threshold_f)

        prob = hitting / len(member_maxes)
        return prob, member_maxes, float(np.mean(member_maxes))

    def _deterministic_threshold_prob(
        self,
        data: dict,
        threshold_f: float,
        direction: str,
        target_date: Optional[str],
    ) -> Optional[float]:
        """
        Convert a deterministic forecast to a soft probability using
        logistic function based on distance from threshold and model spread assumption.
        """
        daily = data.get("daily", {})
        times = daily.get("time", [])
        maxes = daily.get("temperature_2m_max", [])

        if not times or not maxes:
            # fallback to hourly
            hourly = data.get("hourly", {})
            h_times = hourly.get("time", [])
            h_temps = hourly.get("temperature_2m", [])
            if target_date:
                day_vals = [v for t, v in zip(h_times, h_temps) if t and t.startswith(target_date) and v is not None]
            else:
                day_vals = [v for v in h_temps[:24] if v is not None]
            if not day_vals:
                return None
            forecast_val = max(day_vals)
        else:
            if target_date:
                idx_list = [i for i, t in enumerate(times) if t == target_date]
                if not idx_list:
                    return None
                idx = idx_list[0]
            else:
                idx = 1 if len(times) > 1 else 0
            forecast_val = maxes[idx] if idx < len(maxes) and maxes[idx] is not None else None
            if forecast_val is None:
                return None

        # Soft probability via logistic: assume ±5°F = ±1 sigma
        sigma = 5.0
        z = (forecast_val - threshold_f) / sigma
        from scipy.special import expit
        prob = float(expit(z)) if direction == "above" else float(1 - expit(z))
        return prob

    async def close(self):
        await self.session.aclose()


class WeatherObservations:
    """Fetch actual observations for calibration and bias correction."""

    async def get_noaa_observation(self, station_id: str) -> Optional[dict]:
        """Get latest NOAA NWS observation (US only)."""
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                url = f"{NOAA_NWS_API}/stations/{station_id}/observations/latest"
                resp = await client.get(url, headers={"User-Agent": "PolyWeatherBot/1.0"})
                resp.raise_for_status()
                data = resp.json()
                props = data.get("properties", {})
                temp_c = props.get("temperature", {}).get("value")
                return {
                    "temp_f": round(temp_c * 9/5 + 32, 1) if temp_c else None,
                    "station": station_id,
                    "timestamp": props.get("timestamp"),
                }
        except Exception as e:
            logger.warning(f"[NOAA] observation failed for {station_id}: {e}")
            return None
