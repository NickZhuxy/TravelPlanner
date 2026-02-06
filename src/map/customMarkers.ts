import L from 'leaflet';

export function createNormalIcon(size = 24): L.DivIcon {
  const border = size <= 14 ? 2 : 3;
  return L.divIcon({
    className: '',
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: #4285F4;
      border: ${border}px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
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
      background: #FF9500;
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
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
      background: #34A853;
      border: ${border}px solid white;
      box-shadow: 0 0 0 4px rgba(52,168,83,0.3), 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}
