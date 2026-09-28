export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  relationship: string;
  avatarInitials: string;
};

export const testimonials: Testimonial[] = [
  {
    quote:
      "Edbert consistently went above and beyond during our capstone project. He took the initiative to lead backend architecture decisions and kept the entire team aligned across 18 engineers. His ability to communicate technical trade-offs clearly made him an invaluable team lead.",
    name: "Capstone Teammate",
    role: "Software Engineer",
    relationship: "Biotech Futures Capstone",
    avatarInitials: "DT",
  },
  {
    quote:
      "Working with Edbert on the product migration was a great experience. He automated what would have been weeks of manual work into a reliable script that handled 20,000+ SKUs without a single error. He's the kind of engineer who finds the efficient solution, not just a solution.",
    name: "Project Supervisor",
    role: "Software Engineer",
    relationship: "Europe Enchanting",
    avatarInitials: "OS",
  },
];
