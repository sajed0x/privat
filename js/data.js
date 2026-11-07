/*
 * Default catalogue. This is only the starting point: everything can be
 * edited, added or removed from the "Manage" panel in the site, and those
 * changes are saved in the browser (localStorage). Use "Reset catalogue"
 * in the Manage panel to come back to this list.
 *
 * icon: tube | rack | flask | beaker | syringe | pipette | petri | vial |
 *       gloves | mask | thermometer | stethoscope | bandage | microscope | box
 */
window.DEFAULT_CATEGORIES = [
  { id: "lab", name: "Lab Glassware", color: "#3b82f6" },
  { id: "collection", name: "Sample Collection", color: "#ef4444" },
  { id: "ppe", name: "Protective Equipment", color: "#14b8a6" },
  { id: "diagnostics", name: "Diagnostics", color: "#8b5cf6" },
  { id: "wound", name: "Wound Care", color: "#f59e0b" },
  { id: "equipment", name: "Equipment", color: "#0ea5e9" },
];

window.DEFAULT_PRODUCTS = [
  {
    id: "p-001", name: "Borosilicate Test Tubes", sku: "LAB-TT-1675",
    category: "lab", icon: "tube", price: 24.9, unit: "pack of 100", stock: 340,
    rating: 4.8, badge: "Bestseller",
    description: "Heat-resistant borosilicate 3.3 glass tubes with a reinforced rim. Suitable for heating, mixing and centrifuging at low speeds.",
    specs: { Size: "16 × 150 mm", Material: "Borosilicate 3.3", Capacity: "20 ml", Autoclavable: "Yes" },
  },
  {
    id: "p-002", name: "Vacuum Blood Collection Tubes", sku: "COL-VB-0405",
    category: "collection", icon: "tube", price: 38.5, unit: "box of 100", stock: 210,
    rating: 4.9, badge: "New",
    description: "Sterile vacuum tubes with K2 EDTA additive and colour-coded safety caps for consistent draw volume.",
    specs: { Volume: "4 ml", Additive: "K2 EDTA", Cap: "Lavender", Sterile: "Gamma irradiated" },
  },
  {
    id: "p-003", name: "Polypropylene Tube Rack", sku: "LAB-RK-5012",
    category: "lab", icon: "rack", price: 15.0, unit: "each", stock: 96,
    rating: 4.6, badge: "",
    description: "Stackable 50-position rack for 16 mm tubes. Chemical resistant and autoclavable, with alphanumeric grid markings.",
    specs: { Positions: "50 (5 × 10)", "Tube diameter": "up to 16 mm", Material: "Polypropylene" },
  },
  {
    id: "p-004", name: "Erlenmeyer Flask 250 ml", sku: "LAB-FL-0250",
    category: "lab", icon: "flask", price: 9.75, unit: "each", stock: 180,
    rating: 4.7, badge: "",
    description: "Narrow-neck conical flask with printed white graduations, ideal for titration and mixing without spills.",
    specs: { Capacity: "250 ml", Graduations: "25 ml steps", Material: "Borosilicate 3.3" },
  },
  {
    id: "p-005", name: "Griffin Beaker Set", sku: "LAB-BK-SET5",
    category: "lab", icon: "beaker", price: 32.0, unit: "set of 5", stock: 64,
    rating: 4.5, badge: "",
    description: "Low-form beakers with spout in 50, 100, 250, 500 and 1000 ml sizes.",
    specs: { Sizes: "50–1000 ml", Pieces: "5", Material: "Borosilicate 3.3" },
  },
  {
    id: "p-006", name: "Sterile Luer-Lock Syringes", sku: "COL-SY-0510",
    category: "collection", icon: "syringe", price: 18.4, unit: "box of 100", stock: 520,
    rating: 4.8, badge: "Bestseller",
    description: "Single-use 5 ml syringes with a secure Luer-lock tip and smooth, latex-free plunger.",
    specs: { Volume: "5 ml", Tip: "Luer-lock", "Latex free": "Yes", Sterile: "EO sterilised" },
  },
  {
    id: "p-007", name: "Graduated Transfer Pipettes", sku: "LAB-PP-0300",
    category: "lab", icon: "pipette", price: 12.9, unit: "pack of 500", stock: 410,
    rating: 4.4, badge: "",
    description: "Disposable LDPE pipettes with moulded graduations up to 1 ml. Non-sterile, individually flexible.",
    specs: { Volume: "3 ml", Graduated: "to 1 ml", Material: "LDPE" },
  },
  {
    id: "p-008", name: "Petri Dishes 90 mm", sku: "LAB-PD-0090",
    category: "diagnostics", icon: "petri", price: 27.0, unit: "case of 500", stock: 75,
    rating: 4.7, badge: "",
    description: "Optically clear polystyrene dishes with triple vents for even gas exchange during incubation.",
    specs: { Diameter: "90 mm", Vents: "3", Sterile: "Yes", Material: "Polystyrene" },
  },
  {
    id: "p-009", name: "Cryogenic Storage Vials", sku: "LAB-CV-0020",
    category: "lab", icon: "vial", price: 44.0, unit: "pack of 100", stock: 0,
    rating: 4.6, badge: "",
    description: "Self-standing 2 ml cryovials with external thread and silicone gasket, rated down to −196 °C.",
    specs: { Volume: "2 ml", "Temp. range": "−196 to 121 °C", Thread: "External" },
  },
  {
    id: "p-010", name: "Nitrile Examination Gloves", sku: "PPE-GL-NM",
    category: "ppe", icon: "gloves", price: 11.5, unit: "box of 100", stock: 900,
    rating: 4.9, badge: "Bestseller",
    description: "Powder-free, textured fingertips and 4 mil thickness. Comfortable for long shifts with excellent tactile feel.",
    specs: { Size: "S / M / L / XL", Thickness: "4 mil", Powder: "Free", Colour: "Blue" },
  },
  {
    id: "p-011", name: "Type IIR Surgical Masks", sku: "PPE-MK-2R",
    category: "ppe", icon: "mask", price: 8.9, unit: "box of 50", stock: 1200,
    rating: 4.5, badge: "Sale", oldPrice: 11.9,
    description: "Three-ply fluid-resistant masks with ≥98% bacterial filtration efficiency and a soft nose wire.",
    specs: { Layers: "3", BFE: "≥ 98%", Standard: "EN 14683 Type IIR" },
  },
  {
    id: "p-012", name: "Infrared Forehead Thermometer", sku: "DIA-TH-IR1",
    category: "diagnostics", icon: "thermometer", price: 29.0, unit: "each", stock: 48,
    rating: 4.3, badge: "",
    description: "Non-contact reading in one second with a backlit display, fever alert and memory for 32 readings.",
    specs: { Accuracy: "± 0.2 °C", Distance: "1–3 cm", Memory: "32 readings" },
  },
  {
    id: "p-013", name: "Dual-Head Stethoscope", sku: "DIA-ST-DH",
    category: "diagnostics", icon: "stethoscope", price: 64.0, unit: "each", stock: 22,
    rating: 4.8, badge: "Premium",
    description: "Stainless steel chest piece with tunable diaphragm and bell, and latex-free tubing.",
    specs: { "Chest piece": "Stainless steel", Tubing: "PVC, latex free", Length: "71 cm" },
  },
  {
    id: "p-014", name: "Adhesive Wound Dressings", sku: "WND-AD-1010",
    category: "wound", icon: "bandage", price: 16.75, unit: "box of 50", stock: 260,
    rating: 4.6, badge: "",
    description: "Breathable, low-adherent pads with hypoallergenic adhesive border. Individually sealed and sterile.",
    specs: { Size: "10 × 10 cm", Pad: "Low-adherent", Sterile: "Yes" },
  },
  {
    id: "p-015", name: "Compound Lab Microscope", sku: "EQP-MS-40",
    category: "equipment", icon: "microscope", price: 389.0, unit: "each", stock: 9,
    rating: 4.7, badge: "Premium",
    description: "Binocular microscope with 40×–1000× magnification, LED illumination and mechanical stage.",
    specs: { Magnification: "40×–1000×", Head: "Binocular", Light: "LED, dimmable" },
  },
  {
    id: "p-016", name: "Specimen Transport Box", sku: "COL-BX-UN3373",
    category: "collection", icon: "box", price: 21.0, unit: "each", stock: 140,
    rating: 4.4, badge: "",
    description: "UN3373-compliant triple packaging for biological specimens, with absorbent liner and secondary bag.",
    specs: { Standard: "UN3373 / P650", Capacity: "up to 4 tubes", Absorbent: "Included" },
  },
];
