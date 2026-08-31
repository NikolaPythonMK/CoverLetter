// import fs from "node:fs/promises";
// import path from "node:path";
// import PizZip from "pizzip";
// import Docxtemplater from "docxtemplater";

// export type LetterData = {
//   salutation?: string;
//   intro?: string;
//   bullets?: string[];
//   body?: string;
//   closing?: string;
//   signatureName?: string;
//   meta?: { role?: string; company?: string };
//   plain?: string;
//   applicant?: { name?: string; address?: string; phone?: string; email?: string; website?: string };
//   hiringManager?: { name?: string; title?: string; company?: string; address?: string };
// };

// function mapToTemplateVars(d: LetterData) {
//   return {
//     ROLE: d.meta?.role ?? "",
//     COMPANY: d.meta?.company ?? "",

//     HM_NAME: d.hiringManager?.name ?? "",
//     HM_TITLE: d.hiringManager?.title ?? "",
//     HM_COMPANY: d.hiringManager?.company ?? "",
//     HM_ADDRESS: d.hiringManager?.address ?? "",

//     SALUTATION: d.salutation ?? "",
//     INTRO: d.intro ?? "",
//     BULLETS: d.bullets ?? [],            // <- array of strings
//     BODY: d.body ?? "",
//     CLOSING: d.closing ?? "",
//     SIGNATURE: d.signatureName ?? "",

//     APPLICANT_NAME: d.applicant?.name ?? "",
//     APPLICANT_EMAIL: d.applicant?.email ?? "",
//     APPLICANT_PHONE: d.applicant?.phone ?? "",
//     APPLICANT_WEBSITE: d.applicant?.website ?? "",
//     APPLICANT_ADDRESS: d.applicant?.address ?? "",
//   };
// }

// export async function renderDocxTemplate(templateName: string, data: LetterData): Promise<Uint8Array> {
//   const tplPath = path.join(process.cwd(), "src", "word-templates", `${templateName}.docx`);
//   const buf = await fs.readFile(tplPath);

//   const zip = new PizZip(buf);
//   const doc = new Docxtemplater(zip, {
//     paragraphLoop: true,
//     linebreaks: true,
//     delimiters: { start: "[[", end: "]]" }, // ✅ set delimiters here
//   });

//   doc.setData(mapToTemplateVars(data));

//   try {
//     doc.render();
//   } catch (e: any) {
//     console.error("DocxTemplater error:", JSON.stringify(e, null, 2));
//     throw e;
//   }

//   return doc.getZip().generate({ type: "uint8array" });
// }



import fs from "node:fs/promises";
import path from "node:path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

export type LetterData = {
  salutation?: string;
  intro?: string;
  bullets?: string[];
  body?: string;
  closing?: string;
  signatureName?: string;
  meta?: { role?: string; company?: string };
  plain?: string; // (not used for DOCX)
  applicant?: { name?: string; address?: string; phone?: string; email?: string; website?: string };
  hiringManager?: { name?: string; title?: string; company?: string; address?: string };
};

function mapToTemplateVars(d: LetterData) {
  return {
    ROLE: d.meta?.role ?? "",
    COMPANY: d.meta?.company ?? "",
    HM_NAME: d.hiringManager?.name ?? "",
    HM_TITLE: d.hiringManager?.title ?? "",
    HM_COMPANY: d.hiringManager?.company ?? "",
    HM_ADDRESS: d.hiringManager?.address ?? "",
    SALUTATION: d.salutation ?? "",
    INTRO: d.intro ?? "",
    BULLETS: d.bullets ?? [],
    BODY: d.body ?? "",
    CLOSING: d.closing ?? "",
    SIGNATURE: d.signatureName ?? "",
    APPLICANT_NAME: d.applicant?.name ?? "",
    APPLICANT_EMAIL: d.applicant?.email ?? "",
    APPLICANT_PHONE: d.applicant?.phone ?? "",
    APPLICANT_WEBSITE: d.applicant?.website ?? "",
    APPLICANT_ADDRESS: d.applicant?.address ?? "",
  };
}

export async function renderDocxTemplate(templateName: string, data: LetterData): Promise<Uint8Array> {
  const tplPath = path.join(process.cwd(), "src", "word-templates", `${templateName}.docx`);
  const buf = await fs.readFile(tplPath);
  const zip = new PizZip(buf);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "[[", end: "]]" } // ✅
  });

  doc.setData(mapToTemplateVars(data));
  doc.render();

  return doc.getZip().generate({ type: "uint8array" });
}
