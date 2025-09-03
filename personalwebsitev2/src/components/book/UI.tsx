import { atom } from 'jotai';
import castle from '../../assets/rapunzel-castle.png';;

export const pageAtom = atom(0);

export const pages = [
  {
    front: "book-cover",
    back: "page-1-back", 
    title: "Alyssa's Fairy Tale",
    subtitle: "A Magical Story from Jakarta"
  },
  {
    front: "page-1",
    back: "page-2-back",
    title: "Alyssa's Tale", 
    content: "Once upon a time, in a kingdom far, far away, there lived a beautiful princess in all of Jakarta. Her name, is Alyssa. She had a heart full of love and a spirit as bright as the city lights.",
    imageURL: castle
  },
  {
    front: "page-2", 
    back: "page-3-back",
    title: "The Prince's Call",
    content: "Suddenly, a prince called her and said 'Punyukunyungkunyung...' His voice echoed through the magical towers of the city, carried by the evening breeze and the glow of a thousand lanterns."
  },
  {
    front: "page-3",
    back: "page-4-back", 
    title: "A Love Story",
    content: "Their hearts connected across the bustling streets of Jakarta, where modern towers met ancient magic. The floating lanterns danced around them, celebrating their destined meeting under the twilight sky."
  },
  {
    front: "page-4",
    back: "page-5-back",
    title: "Magical Moments", 
    content: "Together they explored the enchanted gardens hidden within the urban landscape. Every step they took was accompanied by glowing lanterns that seemed to understand the language of their love."
  },
  {
    front: "page-5",
    back: "book-back-cover",
    title: "Happily Ever After",
    content: "And so they lived happily ever after, their love illuminating Jakarta like the most beautiful constellation of floating lanterns, bringing magic to everyone who believed in fairy tales."
  }
];

export const UI = () => {
  // This can be expanded with page navigation UI if needed
  return null;
};