import { redirect } from "next/navigation";

/** The radar is the product's front door; the old Daily briefing is retired. */
export default function Home() {
  redirect("/radar");
}
