export type Checkpoint = {
  /** Position along the journey, 0..1 */
  t: number;
  id: string;
  title: string;
  text: string;
  /** Short label painted on the road sign */
  short: string;
};

export const checkpoints: Checkpoint[] = [
  {
    t: 0.04,
    id: "chapter-beginnings",
    title: "Beginnings",
    short: "2002",
    text: "Born in 2002, the youngest — learned to be heard.",
  },
  {
    t: 0.18,
    id: "chapter-jakarta",
    title: "High School in Jakarta",
    short: "Jakarta",
    text: "International high school in Jakarta. TEDxYouth organiser, vice student president. Learned to lead early.",
  },
  {
    t: 0.34,
    id: "chapter-atlanta",
    title: "Atlanta & the Covid Era",
    short: "Atlanta",
    text: "Moved to Atlanta and learned how to code. First Hello World.",
  },
  {
    t: 0.5,
    id: "chapter-sydney",
    title: "Sydney Chapter",
    short: "Sydney",
    text: "Moved to Sydney for my undergraduate degree. Instantly felt like home.",
  },
  {
    t: 0.66,
    id: "chapter-content",
    title: "Content Creation Era",
    short: "Twitch",
    text: "Pursued side projects. Built a Twitch community of 1.8k — learned content creation and networking.",
  },
  {
    t: 0.82,
    id: "chapter-gamedev",
    title: "Locked In Era",
    short: "Focus",
    text: "Decided I had to specialise and chose two areas: web development and game development.",
  },
  {
    t: 0.95,
    id: "chapter-next",
    title: "What's Next?",
    short: "Next",
    text: "Still writing the story — maybe you'll be part of it :)",
  },
];
