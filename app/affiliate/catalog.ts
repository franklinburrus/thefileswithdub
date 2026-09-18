export type AmazonProduct = {
  title: string;
  brand: string;
  category: "Self care" | "Pantry" | "Home" | "Wellness";
  image: {
    src: string;
    position: string;
    fit?: "contain";
  };
  sponsoredDestination: string;
};

const cantDubUsStore = "https://www.amazon.com/shop/dubhere/list/297YHKL7CRWUL?tag=omarilee-20&ref_=cm_sw_r_apin_aipsfshop_F7N6H5XEB9GGS3ZSJ8G2&ccs_id=84ce42c9-c070-4e45-890d-3d218787ecd4";
const storefrontImage = "/amazon-cant-dub-us-store.webp";

export const amazonProducts: AmazonProduct[] = [
  { brand: "Plant Guru", title: "Raw African Black Soap, 8 oz. Bar", category: "Self care", image: { src: "/amazon-african-black-soap.png", position: "center", fit: "contain" }, sponsoredDestination: cantDubUsStore },
  { brand: "Amazon Essentials", title: "Exfoliating Cotton Rounds", category: "Self care", image: { src: storefrontImage, position: "42.15% 17.32%" }, sponsoredDestination: cantDubUsStore },
  { brand: "Swisspers", title: "Premium Cotton Rounds", category: "Self care", image: { src: storefrontImage, position: "49.81% 17.32%" }, sponsoredDestination: cantDubUsStore },
  { brand: "Reddi Wip", title: "Non-Dairy Almond Whipped Cream", category: "Pantry", image: { src: storefrontImage, position: "57.47% 17.32%" }, sponsoredDestination: cantDubUsStore },
  { brand: "THAYERS", title: "Hydrating Milky Face Toner", category: "Self care", image: { src: storefrontImage, position: "65.13% 17.32%" }, sponsoredDestination: cantDubUsStore },
  { brand: "THAYERS", title: "Alcohol-Free Hydrating Unscented Toner", category: "Self care", image: { src: storefrontImage, position: "34.48% 43.79%" }, sponsoredDestination: cantDubUsStore },
  { brand: "THAYERS", title: "Alcohol-Free Rose Petal Witch Hazel Toner", category: "Self care", image: { src: storefrontImage, position: "42.15% 43.79%" }, sponsoredDestination: cantDubUsStore },
  { brand: "THAYERS", title: "Alcohol-Free Hydrating Cucumber Toner", category: "Self care", image: { src: storefrontImage, position: "49.81% 43.79%" }, sponsoredDestination: cantDubUsStore },
  { brand: "Good Molecules", title: "Hyaluronic Acid Serum", category: "Self care", image: { src: storefrontImage, position: "57.47% 43.79%" }, sponsoredDestination: cantDubUsStore },
  { brand: "RAW", title: "Classic King Size Slim Rolling Papers", category: "Home", image: { src: "/amazon-raw-rolling-papers.png", position: "center", fit: "contain" }, sponsoredDestination: cantDubUsStore },
  { brand: "Momcozy", title: "Pregnancy Pillow for Sleeping", category: "Wellness", image: { src: storefrontImage, position: "34.48% 67.95%" }, sponsoredDestination: cantDubUsStore },
  { brand: "Herb Pharm", title: "Damiana System Restoration Herbal Supplement", category: "Wellness", image: { src: "/amazon-herb-pharm-damiana.png", position: "center", fit: "contain" }, sponsoredDestination: cantDubUsStore },
];

export const amazonStorefront = cantDubUsStore;
