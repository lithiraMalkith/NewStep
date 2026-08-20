export const LKR = (value: number) =>
  "Rs. " + value.toLocaleString("en-LK", { maximumFractionDigits: 0 });

/** Delivery charges by district (Section 13 — settings.deliveryCharges). */
export const DELIVERY_CHARGES: Record<string, number> = {
  Colombo: 350,
  Gampaha: 400,
  Kalutara: 400,
  Kandy: 450,
  Galle: 450,
  Matara: 450,
  Kurunegala: 450,
  Jaffna: 550,
  Anuradhapura: 500,
  Batticaloa: 550,
  Badulla: 500,
  Ratnapura: 450,
  Trincomalee: 550,
  Hambantota: 500,
  Puttalam: 500,
  Matale: 480,
  "Nuwara Eliya": 480,
  Ampara: 550,
  Polonnaruwa: 520,
  Monaragala: 520,
  Kegalle: 450,
  Mannar: 580,
  Vavuniya: 560,
  Mullaitivu: 580,
  Kilinochchi: 580,
};

export const DISTRICTS = Object.keys(DELIVERY_CHARGES).sort();

export const FREE_DELIVERY_THRESHOLD = 15000;

export const deliveryFor = (district: string, subtotal: number) => {
  if (!district) return 0;
  if (subtotal >= FREE_DELIVERY_THRESHOLD) return 0;
  return DELIVERY_CHARGES[district] ?? 500;
};
