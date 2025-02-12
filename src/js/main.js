import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import { Image as ImageLayer, Vector as VectorLayer } from 'ol/layer';
import { ImageStatic } from 'ol/source';
import { Vector as VectorSource } from 'ol/source';
import { Feature } from 'ol';
import { Point } from 'ol/geom';
import { Icon, Style } from 'ol/style';
import Overlay from 'ol/Overlay';
import { Projection } from "ol/proj";

const imageExtent = [0, 0, 5009, 6507];

const projection = new Projection({
  code: 'credas-world-map',
  units: 'pixels',
  extent: imageExtent,
});

const map = new Map({
  target: 'map',
  layers: [
    new ImageLayer({
      source: new ImageStatic({
        url: './media/credas.png',
        imageExtent: imageExtent,
      }),
    }),
  ],
  view: new View({
    projection,
    extent: imageExtent,
    center: [5009 / 2, 6507 / 2], // Center of the image
    zoom: 2,
    minZoom: 1,
    maxZoom: 5,
    constrainOnlyCenter: true,
  }),
});

const vectorSource = new VectorSource();
const vectorLayer = new VectorLayer({
  source: vectorSource,
});
map.addLayer(vectorLayer);

const defaultPinScale = 0.18;
const hoverPinScale = 0.20;

const locations = [
  { coords: [1700, 4880], name: 'Jima Monastery', url: 'https://duckduckgo.com/?q=jima+monastery' },
  { coords: [3800, 3028], name: 'The Emerald Heaven of Nok', url: 'https://duckduckgo.com/?q=the+emerald+heaven+of+nok' },
  { coords: [320, 1580], name: 'a Scary Volcano', url: 'https://duckduckgo.com/?q=a+scary+volcano' },
];

const MAX_RESOLUTION_FOR_POINTS = 3;

const features = locations.map(({ coords, name, url }) => {
  const feature = new Feature({ geometry: new Point(coords) });
  const iconStyle = new Style({
    image: new Icon({
      src: './media/pin.png',
      anchor: [0.5, 0.98],
      scale: defaultPinScale,
    }),
  });

  feature.setStyle((_feature, resolution) => {
    if (resolution <= MAX_RESOLUTION_FOR_POINTS)
      return iconStyle;
    return null;
  });
  vectorSource.addFeature(feature);

  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  tooltip.innerHTML = `
  <span class="tooltip__title">${name}</span>
  <br/>
  <a href="${url}" target="_blank" rel="noopener noreferrer">&gt; search more</a>
  `;
  const overlay = new Overlay({
    element: tooltip,
    offset: [0, -55],
    positioning: 'bottom-center',
    autoPan: true,
  });
  map.addOverlay(overlay);

  feature.set('overlay', overlay);
  feature.set('iconStyle', iconStyle);
  feature.set('url', url);
  overlay.setPosition(undefined);

  return feature;
});

// map.on('singleclick', event => {
//   const feature = map.forEachFeatureAtPixel(event.pixel, (feature) => feature);
//   if (feature) {
//     const url = feature.get('url');
//     if (url) {
//       window.open(url, '_blank');
//     }
//   }
// });

map.on('singleclick', event => {
  let hoveredFeature = null;

  map.forEachFeatureAtPixel(event.pixel, (feature) => {
    hoveredFeature = feature;
  });

  features.forEach((feature) => {
    const overlay = feature.get('overlay');
    if (feature === hoveredFeature) {
      overlay.setPosition(feature.getGeometry().getCoordinates());
    } else {
      overlay.setPosition(undefined);
    }
  });
});

const mapElement = map.getTargetElement();
let wasFeatureHovered = false;
const hoveredFeatures = new Set();
map.on('pointermove', event => {
  let isFeatureHovered = false;

  const currentlyHoveredFeatures = new Set();
  map.forEachFeatureAtPixel(event.pixel, feature => {
    isFeatureHovered = true;
    const iconStyle = feature.get('iconStyle');
    iconStyle.getImage().setScale(hoverPinScale);
    currentlyHoveredFeatures.add(feature);
  });

  features.forEach(feature => {
    if (currentlyHoveredFeatures.has(feature) !== hoveredFeatures.has(feature)) {
      const iconStyle = feature.get('iconStyle');
      if (currentlyHoveredFeatures.has(feature)) {
        hoveredFeatures.add(feature);
        iconStyle.getImage().setScale(hoverPinScale);
      }
      else if (!currentlyHoveredFeatures.has(feature)) {
        hoveredFeatures.delete(feature);
        iconStyle.getImage().setScale(defaultPinScale);
      }
      feature.setStyle(iconStyle);
    }
  });

  if (isFeatureHovered !== wasFeatureHovered) {
    if (isFeatureHovered) mapElement.style.cursor = 'pointer';
    else mapElement.style.cursor = 'default';
    wasFeatureHovered = isFeatureHovered;
  }
});
