import FilesPlatform from "./components/files-platform";
import { metadataFor } from "./seo";

export const metadata = metadataFor("home");

export default function HomePage() {
  return <FilesPlatform page="home" />;
}
