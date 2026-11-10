import Link from "next/link";
export default function NotFound() {
  return (
    <div className="empty"><h1 className="tool-h">Not found</h1><p>There is no page here. Try the <Link href="/">list of tools</Link>, or press <kbd>/</kbd> to search.</p></div>
  );
}
