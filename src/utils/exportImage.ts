import { CRITICAL_TIME, type SimParams } from './flowField';

export type ImageResolution = '1920x1080' | '2560x1440' | '3840x2160';
export type ImageAspect = '16:9' | '1:1' | '9:16';

export interface ImageOverlayOptions {
  title: boolean;
  time: boolean;
  params: boolean;
  legend: boolean;
  disclaimer: boolean;
}

const RESOLUTION_HEIGHT: Record<ImageResolution, number> = {
  '1920x1080': 1080,
  '2560x1440': 1440,
  '3840x2160': 2160,
};

const ASPECT_RATIO: Record<ImageAspect, number> = {
  '16:9': 16 / 9,
  '1:1': 1,
  '9:16': 9 / 16,
};

function targetSize(resolution: ImageResolution, aspect: ImageAspect): { w: number; h: number } {
  const h = RESOLUTION_HEIGHT[resolution];
  const w = Math.round(h * ASPECT_RATIO[aspect]);
  return { w, h };
}

/**
 * Composites the live WebGL canvas into a target-resolution/aspect PNG with
 * optional text overlays, using Canvas 2D so the SAME loaded Georgian
 * webfonts render identically to what is on screen. Requires the source
 * canvas's WebGL context to have been created with preserveDrawingBuffer,
 * otherwise the captured frame can be blank.
 */
export async function composeSceneImage(
  sourceCanvas: HTMLCanvasElement,
  resolution: ImageResolution,
  aspect: ImageAspect,
  overlays: ImageOverlayOptions,
  info: { t: number; params: SimParams; mode: string },
): Promise<Blob> {
  await document.fonts.ready;

  const { w, h } = targetSize(resolution, aspect);
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d');
  if (!ctx) throw new Error('canvas-2d-unavailable');

  ctx.fillStyle = '#020305';
  ctx.fillRect(0, 0, w, h);

  // Fit the source canvas into the target frame, cropping to cover (never stretching).
  const srcRatio = sourceCanvas.width / sourceCanvas.height;
  const dstRatio = w / h;
  let sx = 0;
  let sy = 0;
  let sw = sourceCanvas.width;
  let sh = sourceCanvas.height;
  if (srcRatio > dstRatio) {
    sw = sourceCanvas.height * dstRatio;
    sx = (sourceCanvas.width - sw) / 2;
  } else {
    sh = sourceCanvas.width / dstRatio;
    sy = (sourceCanvas.height - sh) / 2;
  }
  ctx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, w, h);

  const scale = h / 1080;
  const pad = 36 * scale;

  if (overlays.title) {
    ctx.font = `600 ${40 * scale}px NVSCinema, sans-serif`;
    ctx.fillStyle = '#f2f7fb';
    ctx.textBaseline = 'top';
    ctx.fillText('ნავიე-სტოქსის სინგულარობა', pad, pad);
  }

  if (overlays.time) {
    ctx.font = `500 ${24 * scale}px NVSBody, sans-serif`;
    ctx.fillStyle = '#7ec8dd';
    ctx.textBaseline = 'top';
    const timeY = overlays.title ? pad + 54 * scale : pad;
    ctx.fillText(`t = ${info.t.toFixed(3)}   T − t = ${(CRITICAL_TIME - info.t).toFixed(3)}`, pad, timeY);
  }

  if (overlays.params) {
    const lines = [
      `ν = ${info.params.viscosity.toFixed(2)}`,
      `შეკუმშვა = ${info.params.radialCompression.toFixed(2)}`,
      `გაწელვა = ${info.params.axialStretch.toFixed(2)}`,
      `ბრუნვა = ${info.params.rotationIntensity.toFixed(2)}`,
      `რეჟიმი: ${info.mode}`,
    ];
    ctx.font = `400 ${18 * scale}px NVSBody, sans-serif`;
    ctx.fillStyle = 'rgba(238,242,247,0.85)';
    ctx.textBaseline = 'bottom';
    ctx.textAlign = 'left';
    let y = h - pad - (overlays.disclaimer ? 60 * scale : 0);
    for (let i = lines.length - 1; i >= 0; i--) {
      ctx.fillText(lines[i], pad, y);
      y -= 24 * scale;
    }
  }

  if (overlays.legend) {
    const items: [string, string][] = [
      ['#3a9a95', 'ნელი ბრუნვა'],
      ['#d99a3e', 'სწრაფი ბრუნვა'],
    ];
    ctx.font = `400 ${16 * scale}px NVSBody, sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    let ly = pad + (overlays.title ? 100 * scale : 0);
    for (const [color, label] of items) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(w - pad - 140 * scale, ly, 6 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(238,242,247,0.85)';
      ctx.fillText(label, w - pad - 122 * scale, ly);
      ly += 26 * scale;
    }
  }

  if (overlays.disclaimer) {
    ctx.font = `400 ${13 * scale}px NVSBody, sans-serif`;
    ctx.fillStyle = 'rgba(224,179,130,0.9)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('სასწავლო მოდელი — არ წარმოადგენს 2026 წლის მტკიცების რიცხვით რეპროდუქციას.', pad, h - pad);
  }

  return new Promise((resolve, reject) => {
    out.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob-failed'))), 'image/png');
  });
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
