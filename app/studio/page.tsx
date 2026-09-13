import FilesPlatform from "../components/files-platform";
import { metadataFor } from "../seo";

export const metadata = metadataFor("studio");

export default function StudioPage() {
  return <FilesPlatform page="studio" />;
}
