export const demoUsers = [
  {
    name: "Maya Laurent",
    role: "Marketing Lead",
    accent: "#22d3ee"
  },
  {
    name: "Noah Benali",
    role: "Product Manager",
    accent: "#a78bfa"
  },
  {
    name: "Ines Moreau",
    role: "HR Ops",
    accent: "#34d399"
  }
];

export function getCurrentUser() {
  const index = Math.abs(window.navigator.userAgent.length + window.innerWidth) % demoUsers.length;
  return demoUsers[index];
}
