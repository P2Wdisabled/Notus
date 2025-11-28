export const clamp01 = (val: number) => Math.min(1, Math.max(0, val));
export const degToRad = (deg: number) => (deg * Math.PI) / 180;

export const extractFuncBody = (input: string) => {
  const start = input.indexOf("(");
  const end = input.lastIndexOf(")");
  return start >= 0 && end > start ? input.slice(start + 1, end) : "";
};

export const parseAlpha = (value?: string | null) => {
  if (!value) return 1;
  const trimmed = value.trim();
  if (!trimmed) return 1;
  const percent = trimmed.endsWith("%");
  const num = parseFloat(trimmed.replace(/%/g, ""));
  if (Number.isNaN(num)) return 1;
  return clamp01(percent ? num / 100 : num);
};

export const parseLab = (input: string) => {
  const body = extractFuncBody(input);
  const [labPart, alphaPart] = body.split("/");
  const parts = labPart
    .replace(/,/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length < 3) return null;
  const L = parseFloat(parts[0]);
  const a = parseFloat(parts[1]);
  const b = parseFloat(parts[2]);
  if ([L, a, b].some((n) => Number.isNaN(n))) return null;
  const alpha = parseAlpha(alphaPart);
  return { L, a, b, alpha };
};

export const parseLch = (input: string) => {
  const body = extractFuncBody(input);
  const [lchPart, alphaPart] = body.split("/");
  const parts = lchPart
    .replace(/,/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length < 3) return null;
  const L = parseFloat(parts[0]);
  const C = parseFloat(parts[1]);
  const H = parseFloat(parts[2]);
  if ([L, C, H].some((n) => Number.isNaN(n))) return null;
  const alpha = parseAlpha(alphaPart);
  const rad = degToRad(H % 360);
  return { L, a: C * Math.cos(rad), b: C * Math.sin(rad), alpha };
};

export const labToRgb = (lab: { L: number; a: number; b: number; alpha: number }) => {
  const { L, a, b, alpha } = lab;
  const refX = 0.96422;
  const refY = 1;
  const refZ = 0.82521;
  const epsilon = 216 / 24389;
  const kappa = 24389 / 27;

  const fy = (L + 16) / 116;
  const fx = fy + a / 500;
  const fz = fy - b / 200;

  const fx3 = fx ** 3;
  const fz3 = fz ** 3;

  const xr = fx3 > epsilon ? fx3 : (116 * fx - 16) / kappa;
  const yr = L > kappa * epsilon ? ((L + 16) / 116) ** 3 : L / kappa;
  const zr = fz3 > epsilon ? fz3 : (116 * fz - 16) / kappa;

  const Xd50 = xr * refX;
  const Yd50 = yr * refY;
  const Zd50 = zr * refZ;

  const M = [
    [0.9554734527042182, -0.023098536874261423, 0.0632593086610217],
    [-0.028369706963208136, 1.0099954580058226, 0.021041398966943008],
    [0.012314001688319899, -0.020507696433477912, 1.3299097632096058],
  ];

  const X = M[0][0] * Xd50 + M[0][1] * Yd50 + M[0][2] * Zd50;
  const Y = M[1][0] * Xd50 + M[1][1] * Yd50 + M[1][2] * Zd50;
  const Z = M[2][0] * Xd50 + M[2][1] * Yd50 + M[2][2] * Zd50;

  const xyzToRgb = [
    [3.2404542, -1.5371385, -0.4985314],
    [-0.969266, 1.8760108, 0.041556],
    [0.0556434, -0.2040259, 1.0572252],
  ];

  const rLin = xyzToRgb[0][0] * X + xyzToRgb[0][1] * Y + xyzToRgb[0][2] * Z;
  const gLin = xyzToRgb[1][0] * X + xyzToRgb[1][1] * Y + xyzToRgb[1][2] * Z;
  const bLin = xyzToRgb[2][0] * X + xyzToRgb[2][1] * Y + xyzToRgb[2][2] * Z;

  const linearToSrgb = (c: number) => {
    if (Number.isNaN(c)) return 0;
    if (c <= 0.0031308) return 12.92 * c;
    return 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  };

  const r = Math.round(clamp01(linearToSrgb(rLin)) * 255);
  const g = Math.round(clamp01(linearToSrgb(gLin)) * 255);
  const bVal = Math.round(clamp01(linearToSrgb(bLin)) * 255);

  return alpha < 1 ? `rgba(${r}, ${g}, ${bVal}, ${alpha})` : `rgb(${r}, ${g}, ${bVal})`;
};

export const normalizeColor = (value: string | null): string | null => {
  if (!value) return null;
  let output = value;
  const replaceLab = (match: string) => {
    const parsed = parseLab(match);
    return parsed ? labToRgb(parsed) : match;
  };
  const replaceLch = (match: string) => {
    const parsed = parseLch(match);
    return parsed ? labToRgb(parsed) : match;
  };
  if (/lab\(/i.test(output)) {
    output = output.replace(/lab\([^()]*\)/gi, replaceLab);
  }
  if (/lch\(/i.test(output)) {
    output = output.replace(/lch\([^()]*\)/gi, replaceLch);
  }
  return output;
};

export const blobToDataURL = async (blob: Blob) => {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read blob"));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(blob);
  });
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
};

export const waitForImages = async (root: HTMLElement) => {
  const images = Array.from(root.querySelectorAll("img")) as HTMLImageElement[];
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) return resolve();
          const done = () => {
            img.removeEventListener("load", done);
            img.removeEventListener("error", done);
            resolve();
          };
          img.addEventListener("load", done);
          img.addEventListener("error", done);
        })
    )
  );
};

export const forceLightTheme = () => {
  const htmlEl = document.documentElement;
  const bodyEl = document.body;
  if (!htmlEl || !bodyEl) return () => {};

  const hadDarkClass = htmlEl.classList.contains("dark");
  if (!hadDarkClass) return () => {};

  const previousVisibility = bodyEl.style.visibility;
  const previousTransition = bodyEl.style.transition;

  bodyEl.style.transition = "none";
  bodyEl.style.visibility = "hidden";
  htmlEl.classList.remove("dark");

  return () => {
    if (hadDarkClass) {
      htmlEl.classList.add("dark");
    }
    bodyEl.style.visibility = previousVisibility;
    bodyEl.style.transition = previousTransition;
  };
};