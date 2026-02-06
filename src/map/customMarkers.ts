import L from 'leaflet';

// Warm cartographic marker colors
const MARKER_BLUE = 'hsl(215, 70%, 58%)';
const MARKER_AMBER = 'hsl(38, 90%, 58%)';
const MARKER_SELECTED = 'hsl(38, 90%, 58%)';
const MARKER_STAY = 'hsl(265, 65%, 60%)';
const MARKER_BORDER = 'hsla(40, 15%, 90%, 0.9)';

export function createNormalIcon(size = 24): L.DivIcon {
  const border = size <= 14 ? 2 : 3;
  return L.divIcon({
    className: '',
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${MARKER_BLUE};
      border: ${border}px solid ${MARKER_BORDER};
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function createTemporaryIcon(): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div class="marker-temporary" style="
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: ${MARKER_AMBER};
      border: 3px solid ${MARKER_BORDER};
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export function createSelectedIcon(size = 32): L.DivIcon {
  const border = size <= 18 ? 2 : 3;
  return L.divIcon({
    className: '',
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${MARKER_SELECTED};
      border: ${border}px solid ${MARKER_BORDER};
      box-shadow: 0 0 0 4px hsla(38, 90%, 58%, 0.25), 0 1px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function createStayIcon(size = 24): L.DivIcon {
  const border = size <= 14 ? 2 : 3;
  return L.divIcon({
    className: '',
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${MARKER_STAY};
      border: ${border}px solid ${MARKER_BORDER};
      box-shadow: 0 0 0 3px hsla(265, 65%, 60%, 0.25), 0 1px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}
