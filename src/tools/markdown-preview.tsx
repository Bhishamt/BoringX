import DOMPurify from "dompurify";
import type { BlockDef, ToolMeta } from "@/engine/types";
import { bool } from "@/engine/p";
import { toolFromRecipe } from "@/components/toolFromRecipe";

export const meta: ToolMeta = {
  slug: "markdown-preview", name: "Markdown Preview", category: "Text",
  blurb: "Renders Markdown. Copies the HTML.",
  description: "Preview Markdown as it will render and copy the HTML. Runs in your browser, nothing is uploaded.",
  keywords: ["markdown", "md", "html", "preview", "render"],
  recipe: { name: "Markdown Preview", input: "# Heading\n\nSome *emphasis*, some **weight**, and a [link](https://example.com).\n\n- one\n- two\n\n```js\nconsole.log('boring');\n```\n\n| a | b |\n|---|---|\n| 1 | 2 |", steps: [{ b: "markdown-html", p: { gfm: true } }] },
};

export const blocks: BlockDef[] = [{
  id: "markdown-html", name: "Markdown to HTML", category: "Text", description: "Converts Markdown to HTML source.",
  params: [bool("gfm", "GitHub-flavoured (tables, strikethrough)", true)],
  run: async (input, p) => {
    const { marked } = await import("marked");
    return String(await marked.parse(input, { gfm: Boolean(p.gfm), async: true }));
  },
}];

export default toolFromRecipe(meta.recipe!, blocks, {
  inputLabel: "Markdown", outputLabel: "Preview", outputName: "preview.html", inputRows: 12,
  renderOutput: (html) => <div className="md" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />,
});
