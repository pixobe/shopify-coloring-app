async function loadColoringApp() {
  const response = await fetch("/apps/pixobe-coloring-app/config");
  if (!response.ok) throw new Error("Fetch failed");

  const data = await response.json();

  const {
    settings = {},
    digest = "",
    identifier = "",
    plan = "",
    expiry = "",
  } = data;

  const container = document.getElementById("coloring-app-container");

  const src = container.dataset.src;
  const template = `
    <coloring-app
      src="${src}"
      identifier="${identifier}"
      digest="${digest}"
      plan="${plan}"
      expiry="${expiry}"
      paint="${settings.paint ?? false}"
      pencil="${settings.pencil ?? false}"
      zoom="${settings.zoom ?? false}"
      print="${settings.print ?? false}"
      download="${settings.download ?? false}"
      brightness="${settings.brightness ?? false}"
      colors="${(settings.colors || "").trim()}"
    ></coloring-app>
  `;

  container.innerHTML = template;
}

loadColoringApp().catch(console.error);
