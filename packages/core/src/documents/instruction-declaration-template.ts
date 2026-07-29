import { escapeHtml, renderDocumentShell } from "./shared";

const INSTRUCTION_TYPE_LABEL: Record<string, string> = {
  INITIAL: "Начален инструктаж",
  WORKPLACE: "Инструктаж на работното място",
  PERIODIC: "Периодичен инструктаж",
  EXTRAORDINARY: "Извънреден инструктаж",
};

export interface InstructionDeclarationPayload {
  documentNumber: string;
  employeeName: string;
  instructionType: string;
  conductedAt: string;
  instructorName: string;
  confirmedAt: string;
  confirmedIp: string;
}

/**
 * OSH-6's ГИТ-ready compliance declaration: a timestamped, IP-logged record
 * that the named employee acknowledged their instruction. Rendered via
 * packages/core/src/pdf.ts, same as the FIN-1 templates.
 */
export function renderInstructionDeclarationHtml(payload: InstructionDeclarationPayload): string {
  const typeLabel = INSTRUCTION_TYPE_LABEL[payload.instructionType] ?? payload.instructionType;

  const bodyHtml = `
<p><strong>Employee:</strong> ${escapeHtml(payload.employeeName)}</p>
<p><strong>Instruction type:</strong> ${escapeHtml(typeLabel)}</p>
<p><strong>Conducted on:</strong> ${escapeHtml(payload.conductedAt)}</p>
<p><strong>Instructor:</strong> ${escapeHtml(payload.instructorName)}</p>
<hr />
<p><strong>Acknowledged by employee on:</strong> ${escapeHtml(payload.confirmedAt)}</p>
<p><strong>IP address recorded:</strong> ${escapeHtml(payload.confirmedIp)}</p>
<p>This declaration confirms the above employee has digitally acknowledged
completion of the named safety instruction, per Наредба № РД-07-2.</p>`;

  return renderDocumentShell({
    title: "Safety Instruction Declaration",
    documentNumber: payload.documentNumber,
    bodyHtml,
  });
}
