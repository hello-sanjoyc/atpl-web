import { redirect } from "next/navigation";

// Preserve legacy links while keeping About as a homepage section.
export default function AboutRedirect() {
    redirect("/#about");
}
