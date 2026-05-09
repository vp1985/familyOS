export type ChessPlayerOption = {
  id: string;
  name: string;
  source: "family" | "competition";
};

export const CHESS_RESULT_OPTIONS = [
  { value: "WHITE_WIN", label: "Weiß gewonnen" },
  { value: "BLACK_WIN", label: "Schwarz gewonnen" },
  { value: "DRAW", label: "Remis" },
  { value: "CANCELLED", label: "abgebrochen / nicht gewertet" },
] as const;

export function normalizeCompetitionPlayerName(name: string) {
  return name.trim().replace(/\s+/g, " ").slice(0, 80);
}

export function buildChessPlayerOptions(
  familyMembers: Array<{ id: string; name: string }>,
  competitionPlayers: Array<{ id: string; name: string }>,
): ChessPlayerOption[] {
  const familyOptions = familyMembers.map((member) => ({
    id: `family:${member.id}`,
    name: member.name,
    source: "family" as const,
  }));

  const externalOptions = competitionPlayers.map((player) => ({
    id: `competition:${player.id}`,
    name: player.name,
    source: "competition" as const,
  }));

  return [...familyOptions, ...externalOptions].sort((a, b) => a.name.localeCompare(b.name, "de"));
}
