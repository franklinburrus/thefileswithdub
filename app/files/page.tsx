import FilesPlatform from "../components/files-platform";
import { metadataFor } from "../seo";

export const metadata = metadataFor("files");

export default function FilesPage() {
  return <FilesPlatform page="library" />;
}
