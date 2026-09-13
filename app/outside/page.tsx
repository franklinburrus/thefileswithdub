import FilesPlatform from "../components/files-platform";
import { metadataFor } from "../seo";

export const metadata = metadataFor("outside");

export default function OutsidePage() {
  return <FilesPlatform page="files" />;
}
