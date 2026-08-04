// Public marketing content, sourced from the SLTC company profile deck.
//
// This is real company copy, not demo data — it is static by design and the
// landing page is prerendered from it. The portals never read this file: every
// figure they show comes from the API (see lib/api.ts). The former
// `mock-data.ts` dashboard fixtures were removed when the portals went live.
export const company = {
  name: "Sri Lakshmi Transport Company",
  short: "SLTC",
  tagline: "Smart Transportation. Seamless Operations.",
  sub: "Safe, reliable employee, school and outstation transport across Hyderabad and Telangana — backed by 20 years of industry experience.",
  incorporated: "29 Dec 2020",
  emails: ["sltc.shyam6666@gmail.com", "shyamsunderreddy1978@gmail.com"],
  phones: ["+91 81793 14684", "+91 70757 14684"],
};

export const about =
  "Sri Lakshmi Transport Company was incorporated in December 2020 with all necessary licenses, built on two decades of hands-on experience in the travel industry. We operate a well-maintained, regularly serviced fleet and provide safe, dependable transport for businesses, schools and institutions.";

export const stats = [
  { label: "Years of industry experience", value: 20, suffix: "+" },
  { label: "Enterprise & institution clients", value: 8, suffix: "+" },
  { label: "Vehicle sizes, 5 to 44 seats", value: 9, suffix: "" },
  { label: "Operating since", value: 2020, suffix: "", literal: true },
];

// Real fleet sizes from the profile (5, 7, 12, 17, 22, 36, 38, 40, 44).
export const fleet = [
  { type: "5–7 Seater", capacity: 7, use: "Cars for small groups & executives" },
  { type: "12–17 Seater", capacity: 17, use: "Vans for team & shuttle runs" },
  { type: "22–36 Seater", capacity: 36, use: "Mid-size school & staff routes" },
  { type: "38–44 Seater", capacity: 44, use: "High-capacity corporate transport" },
];

export const services = [
  { title: "Employee Transport", desc: "Daily staff movement for offices, plants and pharma campuses, on time." },
  { title: "School & Institution", desc: "Safe, supervised transport for schools, colleges and universities." },
  { title: "Outstation Trips", desc: "Comfortable long-distance travel for teams and events." },
  { title: "AC & Non-AC Options", desc: "Choose the comfort level that fits the route and the budget." },
  { title: "Well-Maintained Fleet", desc: "Regular servicing with all required documents kept current." },
  { title: "Professional Drivers", desc: "Experienced, courteous drivers for a smooth, secure journey." },
];

export const whyChooseUs = [
  "Safe and comfortable travel for every passenger",
  "Reliable service available 24/7",
  "Well-organised, high-quality management",
  "Complete transport solutions for businesses",
  "Dedicated to 100% customer satisfaction",
];

// Real client list from the profile.
export const clients = [
  { name: "Amazon", location: "Near RGI Airport", since: "2021" },
  { name: "Aurobindo Pharma", location: "TSIIC, Jadcherla", since: "2022" },
  { name: "NMIMS University", location: "TSIIC, Jadcherla", since: "2021 – Present" },
  { name: "SVKM's School", location: "TSIIC, Jadcherla", since: "2021 – Present" },
  { name: "Amara Raja", location: "Bhootpur, Mahabubnagar", since: "2024 – Present" },
  { name: "Trow Nutrition", location: "TSIIC, Jadcherla", since: "2021 – 2024" },
  { name: "AAP Pharma Technologies", location: "Shameerpet", since: "2024 – Present" },
  { name: "Shuttle Services Pvt Ltd", location: "Kondapur", since: "2020" },
];

export const platformModules = [
  "Document Management", "Driver Management", "Route Management", "Organization Management",
  "Tax & EMI Tracking", "Student Management", "Fee Collection", "Analytics Dashboard",
];

export const testimonials = [
  { quote: "Staff transport runs on time across shifts, and billing is clean every month.", name: "Operations Lead", role: "Pharmaceutical client, Jadcherla" },
  { quote: "Parents have full visibility of pickups and our routes simply work.", name: "Administrator", role: "School client, TSIIC" },
  { quote: "Reliable vehicles and professional drivers — exactly what campus transport needs.", name: "Transport Coordinator", role: "University client" },
];

// ---- Homepage bento (key selling points) ----
export const bento = [
  { key: "established", title: "An established operator", body: "Incorporated 2020, built on 20 years of travel-industry experience and fully licensed.", stat: "20+ yrs", tone: "navy", span: "lg:col-span-2" },
  { key: "safety", title: "Safety comes first", body: "Experienced drivers, regularly serviced vehicles and complete statutory documents.", stat: "100%", statLabel: "compliant", tone: "green", span: "" },
  { key: "fleet", title: "A fleet for every need", body: "Cars and buses from 5 to 44 seats, in AC and Non-AC.", stat: "5–44", statLabel: "seats", tone: "navy", span: "" },
  { key: "tracking", title: "Trip coordination", body: "Routes planned and monitored, with a single point of contact for your account.", stat: "24/7", statLabel: "support", tone: "blue", span: "" },
  { key: "area", title: "Across Telangana", body: "Serving Hyderabad and industrial corridors — Jadcherla, Shameerpet, Mahabubnagar and more.", tone: "navy", span: "lg:col-span-2" },
];

// ---- Safety & trust signals ----
export const safety = [
  "Experienced, professional drivers for every route",
  "Vehicles serviced on schedule and kept road-ready",
  "All statutory documents current — RC, permit, insurance, fitness, PUC",
  "Fully licensed since incorporation in 2020",
  "24/7 coordination and a dedicated point of contact",
  "Safe, supervised transport designed for schools and staff",
];
