import 'dotenv/config';

export default async function get_all_achievement_data(appid) {
  const API_KEY = process.env.STEAM_API_KEY;
  if (!API_KEY) {
    console.error("[steam] STEAM_API_KEY missing");
    return [];
  }

  const url =
    "https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?" +
    new URLSearchParams({
      key: API_KEY,
      appid: String(appid),
      l: "en",
    });

  const response = await fetch(url);

  const ct = response.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const text = await response.text();
    console.error("[steam] non-JSON response", {
      url,
      status: response.status,
      contentType: ct,
      head: text.slice(0, 200),
    });
    return [];
  }

  const data = await response.json();

  const achievements = data?.game?.availableGameStats?.achievements;

  if (!Array.isArray(achievements)) {
    // jeu sans succès, schema absent, ou erreur steam
    console.warn("[steam] no achievements schema", { appid, sample: data?.game ?? data });
    return [];
  }

  // normalisation (tu peux garder les champs que tu veux)
  return achievements.map((a) => ({
    name: a.name,
    display_name: a.displayName ?? a.display_name ?? "",
    description: a.description ?? "",
    icon: a.icon,
    icongray: a.icongray,
    hidden: a.hidden ?? 0,
  }));
}