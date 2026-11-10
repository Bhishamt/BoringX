import { Home } from "@/components/Home";
import { SITE } from "@/lib/tools";

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebSite", name: SITE.name, url: SITE.url, description: SITE.tagline }) }} />
      <Home />
    </>
  );
}
