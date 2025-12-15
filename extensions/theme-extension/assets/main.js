async function loadColoringApp() {
  const container = document.getElementById("coloring-app-container");

  try {
    const response = await fetch("/apps/pixobe-coloring-app/config");
    if (!response.ok) {
      container.innerHTML =
        "Unable to load coloring application,please try again later";
    }

    const data = await response.json();

    const {
      settings = {},
      digest = "",
      identifier = "",
      plan = "",
      expiry = "",
    } = data;

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
  } catch (e) {
    console.error(e);
    container.innerHTML =
      e.message || "Unable to load coloring application,please try again later";
  }
}

loadColoringApp().catch(console.error);
