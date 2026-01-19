function MainModule(listingsID = "#listings") {
  const me = {};

  const listingsElement = document.querySelector(listingsID);
  const sortSelect = document.querySelector("#sortPrice");
  const statusEl = document.querySelector("#status");

  let originalListings = [];
  let currentListings = [];

  function stripHtml(htmlString = "") {
    // descriptions contain <br/> and <b> tags, so we need to strip them
    const temp = document.createElement("div");
    temp.innerHTML = htmlString;
    return (temp.textContent || temp.innerText || "").trim();
  }

  

  function parsePriceToNumber(priceStr) {
    if (!priceStr) return Number.POSITIVE_INFINITY;
    const cleaned = String(priceStr).replace(/[^0-9.]/g, "");
    const num = parseFloat(cleaned);
    return Number.isFinite(num) ? num : Number.POSITIVE_INFINITY;
  }

  function parseAmenities(amenitiesField) {
    try {
      if (Array.isArray(amenitiesField)) return amenitiesField;
      if (typeof amenitiesField === "string") {
        const arr = JSON.parse(amenitiesField);
        return Array.isArray(arr) ? arr : [];
      }
      return [];
    } catch {
      return [];
    }
  }

  function getListing(listing) {
  const name = listing.name || "Untitled listing";
  const price = listing.price || "N/A";
  const pic = listing.picture_url || "";
  const hostName = listing.host_name || "Unknown host";
  const hostPhoto = listing.host_thumbnail_url ||"";
  const listingUrl = listing.listing_url || "#";

  const description = stripHtml(listing.description);
  const shortDesc =
    description.length > 200
      ? description.slice(0, 200).trim() + "..."
      : description || "No description provided.";

  const amenities = parseAmenities(listing.amenities).slice(0, 8);

  const amenitiesBadges =
    amenities.length > 0
      ? amenities
          .map((a) => `<span class="badge bg-light text-dark border me-1 mb-1">${a}</span>`)
          .join("")
      : `<span class="text-muted">No amenities listed</span>`;

  return `
    <div class="col-12 col-md-6 col-lg-4 mb-3">
      <div class="card listing">
        <img src="${pic}" class="card-img-top listing-thumb" alt="${name}" loading="lazy" />

        <div class="card-body">
          <h5 class="card-title">${name}</h5>

          <p class="mb-2">
            <span class="badge bg-success">${price}</span>
          </p>

          <p class="card-text small">${shortDesc}</p>

          <div class="host">
            <img class="host-pic" src="${hostPhoto}" alt="${hostName}" loading="lazy" />
            <span class="ms-2"><strong>${hostName}</strong></span>
          </div>

          <div class="mt-3">
            <div class="small"><strong>Amenities</strong></div>
            <div>${amenitiesBadges}</div>
          </div>

          <a class="btn btn-primary btn-sm mt-3" href="${listingUrl}" target="_blank" rel="noreferrer">
            View on Airbnb
          </a>
        </div>
      </div>
    </div>
  `;
}


  function renderListings(listings) {
    listingsElement.innerHTML = listings.map(getListing).join("\n");
    if (statusEl) statusEl.textContent = `Showing ${listings.length} listings`;
  }

  function applySort(mode) {
    if (mode === "none") {
      currentListings = [...originalListings]; // copies original array without changing the og array
      renderListings(currentListings);
      return;
    }

    const sorted = [...currentListings].sort((a, b) => {
      const ap = parsePriceToNumber(a.price);
      const bp = parsePriceToNumber(b.price);
      return mode === "asc" ? ap - bp : bp - ap;
    });

    currentListings = sorted;
    renderListings(currentListings);
  }

  async function loadData() {
    try {
      if (statusEl) statusEl.textContent = "Loading listings...";

      const res = await fetch("./airbnb_sf_listings_500.json");
      if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);

      const listings = await res.json();

      originalListings = listings.slice(0, 50);
      currentListings = [...originalListings];

      renderListings(currentListings);

      if (sortSelect) {
        sortSelect.addEventListener("change", (e) => {
          applySort(e.target.value);
        });
      }
    } catch (err) {
      console.error(err);
      if (statusEl) statusEl.textContent = "Failed to load listings. Check console.";
      listingsElement.innerHTML = `
        <div class="col-12">
          <div class="alert alert-danger">
            Could not load the JSON file. Make sure <code>airbnb_sf_listings_500.json</code> exists and the path is correct.
          </div>
        </div>
      `;
    }
  }

  me.renderListings = renderListings;
  me.loadData = loadData;

  return me;
}

const main = MainModule();
main.loadData();
