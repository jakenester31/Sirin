export const canvas = new OffscreenCanvas(300,300);
export const context = canvas.getContext("2d", { willReadFrequently:true });