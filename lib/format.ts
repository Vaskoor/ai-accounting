export function money(n: number) {
  const neg = n < 0;
  const v = Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  return (neg ? "-Rs " : "Rs ") + v;
}