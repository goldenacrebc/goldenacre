const publishedDrawSheet = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTix4fNM0kDNfYDT87IFdnsmE6TLU-z3FQz82YZQMvrYkWsEGjLcjt2VeeAyD_pDoY8EE_kqVK5cqtb/pubhtml/sheet?headers=false&gid=";

window.drawSheets = [
  { key: "gents", label: "Championship", embedUrl: `${publishedDrawSheet}520391572`, active: true },
  { key: "twoBowl", label: "Men's 2 Bowl", embedUrl: `${publishedDrawSheet}258321269` },
  { key: "handicap", label: "Gerard Handicap", embedUrl: `${publishedDrawSheet}1829000483` },
  { key: "tomwilson", label: "Tom Wilson", embedUrl: `${publishedDrawSheet}192837566` },
  { key: "pairs", label: "Men's Pairs", embedUrl: `${publishedDrawSheet}556874599` },
  { key: "triples", label: "Men's Triples", embedUrl: `${publishedDrawSheet}38554077` },
  { key: "rinks", label: "Men's Rinks", embedUrl: `${publishedDrawSheet}1535857909` }
];
