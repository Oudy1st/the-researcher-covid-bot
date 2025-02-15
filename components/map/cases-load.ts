import mapboxgl from "maplibre-gl";
import amphoesData from "../gis/data/amphoes-data-14days.json";

const loader = (map: mapboxgl.Map) => {
  // Add a geojson point source.
  // Heatmap layers also work with a vector tile source.
  map.addSource("provinces", {
    type: "vector",
    url: "https://v2k.vallarismaps.com/core/tiles/60c42bdb1499452793d179a3?api_key=RWWcffYDhbnw2IV40S3FTqwsQJkeWg6vV3qdkA1QqOGhdSfmAtu0iGEmPxobPru6",
  });
  map.addSource("provinces-label", {
    type: "vector",
    url: "https://v2k.vallarismaps.com/core/tiles/60c4515b1499452793d179a7?api_key=RWWcffYDhbnw2IV40S3FTqwsQJkeWg6vV3qdkA1QqOGhdSfmAtu0iGEmPxobPru6",
  });
  map.addSource("amphoes", {
    promoteId: { "60c452f21499452793d179a8": "fid_" },
    type: "vector",
    url: "https://v2k.vallarismaps.com/core/tiles/60c452f21499452793d179a8?api_key=RWWcffYDhbnw2IV40S3FTqwsQJkeWg6vV3qdkA1QqOGhdSfmAtu0iGEmPxobPru6",
  });
  map.addSource("amphoe", {
    type: "vector",
    url: "https://v2k.vallarismaps.com/core/tiles/60c42abbf718be41ee8b64f7?api_key=RWWcffYDhbnw2IV40S3FTqwsQJkeWg6vV3qdkA1QqOGhdSfmAtu0iGEmPxobPru6",
  });
  var matchExpression: (string | number | string[])[] = [
    "match",
    ["get", "fid_"],
  ];
  amphoesData.forEach((row) => {
    matchExpression.push(row["id"], row["caseCount"]);
  });
  matchExpression.push(0);

  map.addLayer({
    id: "province-fills",
    type: "fill",
    source: "provinces",
    "source-layer": "60c42bdb1499452793d179a3",
    layout: {},
    paint: {
      "fill-opacity": 0.4,
      "fill-color": "#fafafa",
    },
  });
  map.addLayer({
    id: "provinces-outline",
    type: "line",
    source: "provinces",
    "source-layer": "60c42bdb1499452793d179a3",
    paint: {
      "line-color": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        "#212121",
        "rgba(255,255,255,0.2)",
      ],
      "line-width": 1,
    },
  });
  map.addLayer({
    id: "cases-heat",
    type: "circle",
    source: "amphoes",
    "source-layer": "60c452f21499452793d179a8",
    paint: {
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["zoom"],
        2,
        [
          "interpolate",
          ["linear"],
          matchExpression,
          1,
          1,
          10,
          2,
          100,
          4,
          1000,
          8,
        ],
        10,
        [
          "interpolate",
          ["linear"],
          matchExpression,
          1,
          1,
          10,
          4,
          100,
          16,
          1000,
          64,
        ],
      ],
      "circle-color": "rgba(255,0,0,.2)",
      "circle-stroke-width": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        1.5,
        0.5,
      ],
      "circle-stroke-color": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        "#000000",
        "rgb(255,0,0)",
      ],
    },
  });
  map.addLayer({
    id: "amphoe-outline",
    type: "line",
    source: "amphoe",
    "source-layer": "60c42abbf718be41ee8b64f7",
    paint: {
      "line-color": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        "#212121",
        "rgba(255,255,255,0.2)",
      ],
      "line-width": 1,
      "line-opacity": 0.5,
    },
  });
  map.addLayer({
    id: "provinces-label",
    type: "symbol",
    source: "provinces-label",
    "source-layer": "60c4515b1499452793d179a7",
    minzoom: 6,
    maxzoom: 8,
    layout: {
      "text-field": ["get", "PROV_NAMT"],
      "text-font": ["Kanit"],
      "text-variable-anchor": ["top", "bottom", "left", "right"],
      "text-justify": "center",
      "text-size": 12,
    },
    paint: {
      "text-color": "#ffffff",
      "text-halo-width": 0.8,
      "text-halo-blur": 1,
      "text-halo-color": "#424242",
      "text-opacity": ["interpolate", ["linear"], ["zoom"], 7.8, 1],
    },
  });
  map.addLayer({
    id: "amphoe-label",
    type: "symbol",
    source: "amphoes",
    "source-layer": "60c452f21499452793d179a8",
    minzoom: 8,
    layout: {
      "text-field": ["get", "A_NAME_T"],
      "text-font": ["Kanit"],
      "text-variable-anchor": ["top", "bottom", "left", "right"],
      "text-radial-offset": 1,
      "text-justify": "center",
      "text-size": 14,
    },
    paint: {
      "text-color": "#ffffff",
      "text-halo-width": 0.8,
      "text-halo-blur": 1,
      "text-halo-color": "#424242",
    },
  });
};

export default loader;
