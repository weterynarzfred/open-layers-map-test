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
  { coords: [320, 1580], name: 'Scary Volcano', url: 'https://duckduckgo.com/?q=scary+volcano' },
];

const features = locations.map(({ coords, name, url }) => {
  const feature = new Feature({ geometry: new Point(coords) });
  const iconStyle = new Style({
    image: new Icon({
      src: './media/pin.png',
      anchor: [0.5, 0.98],
      scale: defaultPinScale,
    }),
  });
  feature.setStyle(iconStyle);
  vectorSource.addFeature(feature);

  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  tooltip.innerText = name;
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

map.on('singleclick', event => {
  const feature = map.forEachFeatureAtPixel(event.pixel, (feature) => feature);
  if (feature) {
    const url = feature.get('url');
    if (url) {
      window.open(url, '_blank');
    }
  }
});

map.on('pointermove', event => {
  // map.getTargetElement().style.cursor = 'default';
  let hoveredFeature = null;

  map.forEachFeatureAtPixel(event.pixel, (feature) => {
    hoveredFeature = feature;
  });

  features.forEach((feature) => {
    const overlay = feature.get('overlay');
    const iconStyle = feature.get('iconStyle');
    if (feature === hoveredFeature) {
      overlay.setPosition(feature.getGeometry().getCoordinates());
      iconStyle.getImage().setScale(hoverPinScale);
      // map.getTargetElement().style.cursor = 'pointer';
    } else {
      overlay.setPosition(undefined);
      iconStyle.getImage().setScale(defaultPinScale);
    }
    feature.setStyle(iconStyle);
  });
});
