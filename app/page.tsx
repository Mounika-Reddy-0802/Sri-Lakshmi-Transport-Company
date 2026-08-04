import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { Stats } from "@/components/landing/Stats";
import { Bento } from "@/components/landing/Bento";
import { Services } from "@/components/landing/Services";
import { Safety } from "@/components/landing/Safety";
import { Fleet } from "@/components/landing/Fleet";
import { Clients } from "@/components/landing/Clients";
import { Testimonials } from "@/components/landing/Testimonials";
import { Contact } from "@/components/landing/Contact";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <main>
      <Nav />
      <Hero />
      <Stats />
      <Bento />
      <Services />
      <Safety />
      <Fleet />
      <Clients />
      <Testimonials />
      <Contact />
      <Footer />
    </main>
  );
}
