import FilesPlatform from "../components/files-platform";
import { metadataFor } from "../seo";

export const metadata = metadataFor("about");

export default function AboutPage() {
  return <FilesPlatform page="about" />;
}
