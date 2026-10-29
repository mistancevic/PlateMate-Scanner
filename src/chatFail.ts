// DT152 (0.2.132, board Stories104; Coach Milan 29 October 10:22, from Tester 3 Marko's testing): when Chef Mealan does not
// answer in the chat, the failure is his answer under the question, with Ask again; and the question from the Plate fits the server.
// DT152 (0.2.132): why an answer failed, in one line in his voice
export function failWhy(e: unknown): string {
  const m = String((e as { message?: string })?.message ?? "");
  if (/took too long/i.test(m) || (e as { name?: string })?.name === "AbortError") return "I took too long and stopped.";
  if (e instanceof TypeError || /failed to fetch|networkerror|load failed|network/i.test(m)) return "I couldn't be reached just now. Check the connection.";
  return m && !/^Chef Mealan could not answer\.?$/.test(m) ? m : "Something went wrong on my side.";
}
// DT152: the question from the Plate fits the server's 1,000 characters; a big plate names the first foods and how many more
export function plateQuestion(head: string, foods: string[], max = 990): string {
  const all = `${head} ${foods.join(", ")}.`;
  if (all.length <= max) return all;
  for (let n = foods.length - 1; n >= 1; n--) { const q = `${head} ${foods.slice(0, n).join(", ")}, and ${foods.length - n} more.`; if (q.length <= max) return q; }
  return head.slice(0, max);
}
