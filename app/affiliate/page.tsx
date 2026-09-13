import Link from "next/link";
import SiteNavigation from "../components/site-navigation";
import { amazonProducts, amazonStorefront } from "./catalog";

export default function AffiliatePage() {
  return <><SiteNavigation /><main id="main-content" className="affiliate-route panel light affiliate-page">
    <p className="kicker">THE FILES WITH DUB / AFFILIATE STORE</p>
    <h1>Dub’s<br /><em>picks.</em></h1>
    <div className="affiliate-intro">
      <p>Shop products currently filed inside Dub’s Can’t DUB Us Store collection. Product selection and checkout continue securely on Amazon.</p>
      <p className="affiliate-disclosure">As an Amazon Associate, The Files With Dub earns from qualifying purchases.</p>
    </div>
    <div className="amazon-native-bar"><span>Can’t DUB Us Store</span><b>12 current storefront picks</b></div>
    <section className="amazon-product-grid" aria-label="Dub’s Amazon storefront products">
      {amazonProducts.map(product => <a className="amazon-product-card" href={product.sponsoredDestination} target="_blank" rel="sponsored noreferrer" key={`${product.brand}-${product.title}`}>
        <div className={`amazon-product-image${product.image.fit ? " product-image-contain" : ""}`} role="img" aria-label={`${product.brand} ${product.title}`} style={{ backgroundImage: `url(${product.image.src})`, backgroundPosition: product.image.position }} />
        <p>{product.category}</p>
        <h2><span>{product.brand}</span>{product.title}</h2>
        <b>View in Dub’s Amazon store ↗</b>
      </a>)}
    </section>
    <div className="amazon-storefront-footer">
      <div><p className="kicker">FULL COLLECTION</p><h2>Keep browsing on Amazon.</h2><p>See all current items, availability, pricing, delivery, and checkout inside Dub’s official storefront.</p></div>
      <a className="solid" href={amazonStorefront} target="_blank" rel="sponsored noreferrer">Open the full collection ↗</a>
    </div>
    <Link className="outline" href="/">Back to The Files</Link>
  </main></>;
}
