// Content sourced from the SLTC company profile deck. Operational dashboard
// figures are illustrative demo data (replaced by the real API in production).
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

// ---- Dashboard demo data (illustrative) ----
export const revenueTrend = [
  { month: "Jan", revenue: 1180000, collected: 1090000 },
  { month: "Feb", revenue: 1240000, collected: 1170000 },
  { month: "Mar", revenue: 1310000, collected: 1255000 },
  { month: "Apr", revenue: 1390000, collected: 1280000 },
  { month: "May", revenue: 1455000, collected: 1390000 },
  { month: "Jun", revenue: 1520000, collected: 1438000 },
];

export const routeRevenue = [
  { route: "Jadcherla – Pharma", revenue: 312000 },
  { route: "RGI Airport Shuttle", revenue: 286000 },
  { route: "Shameerpet Staff", revenue: 241000 },
  { route: "Mahabubnagar Plant", revenue: 208000 },
  { route: "School Route A", revenue: 176000 },
];

export const occupancy = [
  { name: "Occupied", value: 82 },
  { name: "Available", value: 18 },
];

export const adminKpis = [
  { label: "Total Vehicles", value: "62", delta: "+4 this quarter", tone: "up" },
  { label: "Active Vehicles", value: "58", delta: "94% utilisation", tone: "up" },
  { label: "Organizations", value: "8", delta: "all current", tone: "up" },
  { label: "Passengers / day", value: "3,180", delta: "+120 this month", tone: "up" },
  { label: "Monthly Collection", value: "₹14.4L", delta: "94.6% of target", tone: "up" },
  { label: "Pending Collection", value: "₹82,000", delta: "31 invoices", tone: "down" },
];

export const alerts = [
  { kind: "Insurance", detail: "Bus TS-09-AB-2231 insurance expires in 9 days", due: "22 Jun 2026" },
  { kind: "Driver Licence", detail: "R. Suresh — DL expiry approaching", due: "30 Jun 2026" },
  { kind: "EMI", detail: "Vehicle loan EMI for 3 buses due", due: "05 Jul 2026", amount: "₹2,46,000" },
  { kind: "Road Tax", detail: "Quarterly road tax — 7 vehicles", due: "10 Jul 2026", amount: "₹1,12,000" },
  { kind: "Fitness", detail: "Bus TS-26-CD-1180 fitness renewal", due: "14 Jul 2026" },
];

export const buses = [
  { reg: "TS-09-AB-2231", type: "44 Seater", org: "Aurobindo Pharma", route: "Jadcherla", driver: "R. Suresh", status: "Active" },
  { reg: "TS-26-CD-1180", type: "40 Seater", org: "Amara Raja", route: "Mahabubnagar", driver: "M. Iqbal", status: "Active" },
  { reg: "TS-10-EF-7745", type: "22 Seater", org: "NMIMS University", route: "Jadcherla", driver: "K. Prasad", status: "Active" },
  { reg: "TS-22-GH-9012", type: "17 Seater", org: "Amazon", route: "RGI Airport", driver: "D. Mohan", status: "Maintenance" },
  { reg: "TS-28-IJ-3344", type: "38 Seater", org: "AAP Pharma", route: "Shameerpet", driver: "S. Babu", status: "Active" },
];

export const organizations = [
  { name: "Aurobindo Pharma", type: "Pharma", students: 640, routes: 8, status: "Active", dues: "₹0" },
  { name: "NMIMS University", type: "University", students: 520, routes: 6, status: "Active", dues: "₹38,000" },
  { name: "SVKM's School", type: "School", students: 410, routes: 5, status: "Active", dues: "₹0" },
  { name: "Amazon", type: "Corporate", students: 380, routes: 4, status: "Active", dues: "₹44,000" },
];

export const orgStudents = [
  { id: "SV-1042", name: "Aarav Menon", grade: "Grade 7-B", route: "School A", pickup: "Lake View Gate", status: "Paid" },
  { id: "SV-1043", name: "Diya Sharma", grade: "Grade 5-A", route: "School A", pickup: "Park Avenue", status: "Paid" },
  { id: "SV-1044", name: "Kabir Rao", grade: "Grade 9-C", route: "School B", pickup: "North Junction", status: "Pending" },
  { id: "SV-1045", name: "Anaya Iyer", grade: "Grade 6-B", route: "School B", pickup: "Temple Road", status: "Overdue" },
];

export const studentProfile = {
  name: "Aarav Menon",
  id: "SV-1042",
  org: "SVKM's School",
  grade: "Grade 7-B",
  route: { code: "SCH-A", name: "Jadcherla School Route", distanceKm: 14 },
  pickup: { point: "Lake View Gate", time: "7:45 AM", drop: "3:55 PM" },
  bus: { reg: "TS-09-AB-2231", type: "44 Seater" },
  driver: { name: "R. Suresh", phone: "+91 81793 14684" },
  ratePerKm: 220,
};

export const studentInvoices = [
  { id: "INV-2026-0431", period: "Jun 2026", amount: 3080, status: "Paid", date: "02 Jun 2026" },
  { id: "INV-2026-0388", period: "May 2026", amount: 3080, status: "Paid", date: "03 May 2026" },
  { id: "INV-2026-0501", period: "Jul 2026", amount: 3080, status: "Pending", date: "Due 05 Jul 2026" },
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
