import { useState } from "react";
import type { BlockDef, ToolMeta } from "@/engine/types";
import { text } from "@/engine/p";
import { Btn, DownloadBtn, ErrorNote, FileDrop, Panel, useJob } from "@/components/kit";
import { baseName, fmtBytes } from "@/lib/util";

export const meta: ToolMeta = {
  slug: "csv-excel", name: "CSV to Excel and back", category: "Data",
  blurb: "Turns CSV into an .xlsx file, or a sheet into CSV.",
  description: "Convert CSV to Excel (.xlsx) or Excel to CSV in your browser. Pick the sheet. Nothing is uploaded.",
  keywords: ["csv", "excel", "xlsx", "xls", "spreadsheet", "sheetjs"],
};

const SAMPLE = "id,name,city\n1,Ada,London\n2,Grace,New York\n3,Linus,Helsinki\n";

export async function csvToXlsx(csv: string): Promise<Uint8Array> {
  const X = await import("xlsx");
  const wb = X.read(csv, { type: "string", raw: false });
  return new Uint8Array(X.write(wb, { type: "array", bookType: "xlsx" }));
}
export async function xlsxToCsv(data: Uint8Array | string, sheet?: string, type: "array" | "base64" = "array"): Promise<{ csv: string; sheets: string[] }> {
  const X = await import("xlsx");
  const wb = X.read(data, { type });
  const name = sheet && wb.SheetNames.includes(sheet) ? sheet : wb.SheetNames[0];
  if (!name) throw new Error("This workbook has no sheets.");
  return { csv: X.utils.sheet_to_csv(wb.Sheets[name]), sheets: wb.SheetNames };
}
const toB64 = (u: Uint8Array) => { let s = ""; u.forEach((b) => (s += String.fromCharCode(b))); return btoa(s); };

export const blocks: BlockDef[] = [
  { id: "csv-to-xlsx", name: "CSV to Excel (base64)", category: "Data", description: "Builds an .xlsx workbook from CSV and outputs it as base64.", params: [],
    run: async (input) => { if (!input.trim()) throw new Error("Nothing to convert. Paste some CSV."); return toB64(await csvToXlsx(input)); } },
  { id: "xlsx-to-csv", name: "Excel (base64) to CSV", category: "Data", description: "Reads a base64 .xlsx/.xls workbook and outputs one sheet as CSV.",
    params: [text("sheet", "Sheet name (blank for first)", "")],
    run: async (input, p) => { try { return (await xlsxToCsv(input.trim(), String(p.sheet), "base64")).csv; } catch { throw new Error("Input is not a base64-encoded Excel workbook."); } } },
];

export default function Tool() {
  const [csv, setCsv] = useState(SAMPLE);
  const [xlsx, setXlsx] = useState<Blob | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [sheet, setSheet] = useState("");
  const [book, setBook] = useState<{ name: string; data: Uint8Array } | null>(null);
  const [out, setOut] = useState("");
  const toX = useJob();
  const fromX = useJob();

  const load = async (f: File) => {
    const data = new Uint8Array(await f.arrayBuffer());
    if (/\.(csv|tsv|txt)$/i.test(f.name)) { setCsv(await f.text()); return; }
    await fromX.run(async () => {
      const r = await xlsxToCsv(data).catch(() => { throw new Error(`"${f.name}" could not be read as a spreadsheet. Use .xlsx, .xls or .ods.`); });
      setBook({ name: f.name, data }); setSheets(r.sheets); setSheet(r.sheets[0]); setOut(r.csv);
    });
  };

  return (
    <div className="stack">
      <Panel title="CSV to Excel">
        <textarea className="mono text-in" rows={7} spellCheck={false} aria-label="CSV" value={csv} onChange={(e) => { setCsv(e.target.value); setXlsx(null); }} />
        <ErrorNote error={toX.error} />
        <div className="row">
          <Btn primary onClick={() => toX.run(async () => { if (!csv.trim()) throw new Error("Nothing to convert. Paste some CSV."); setXlsx(new Blob([await csvToXlsx(csv) as unknown as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })); })}>Build .xlsx</Btn>
          {xlsx && <DownloadBtn data={xlsx} name="data.xlsx" label={`Download data.xlsx (${fmtBytes(xlsx.size)})`} />}
        </div>
      </Panel>
      <Panel title="Excel to CSV">
        <FileDrop multiple={false} accept=".xlsx,.xls,.ods,.csv" onFiles={(f) => load(f[0])} hint="Accepts .xlsx, .xls, .ods. A .csv file is loaded into the box above." />
        <ErrorNote error={fromX.error} />
        {book && (
          <>
            <div className="row">
              <label className="field-label" htmlFor="sheet">Sheet</label>
              <select id="sheet" value={sheet} onChange={async (e) => { setSheet(e.target.value); setOut((await xlsxToCsv(book.data, e.target.value)).csv); }}>
                {sheets.map((s) => <option key={s}>{s}</option>)}
              </select>
              <DownloadBtn data={out} name={`${baseName(book.name)}-${sheet}.csv`} type="text/csv" label="Download CSV" primary />
            </div>
            <pre className="mono text-out" data-testid="output">{out.slice(0, 5000)}</pre>
          </>
        )}
      </Panel>
    </div>
  );
}
