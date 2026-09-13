import FilesPlatform from "../components/files-platform";
import { metadataFor } from "../seo";

export const metadata = metadataFor("contact");

export default function ContactPage() {
  return <FilesPlatform page="contact" />;
}
