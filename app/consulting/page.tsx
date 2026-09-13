import FilesPlatform from "../components/files-platform";
import { metadataFor } from "../seo";

export const metadata = metadataFor("consulting");

export default function ConsultingPage() {
  return <FilesPlatform page="consulting" />;
}
