import { v4 as uuidv4 } from 'uuid';

const SRS_TEMPLATE = [
  {
    title: "INTRODUCTION",
    children: [
      { title: "PURPOSE" },
      { title: "SCOPE OF THE SYSTEM" },
      {
        title: "DEFINITIONS & ACRONYMS",
        children: [
          { title: "Definitions" },
          { title: "Acronyms & Abbreviations" }
        ]
      },
      { title: "REFERENCES" },
      { title: "DOCUMENT OVERVIEW" }
    ]
  }
];

const buildTemplate = (template) => {
  return template.map(item => ({
    ...item,
    id: uuidv4(),
    content: item.content || '',
    children: item.children ? buildTemplate(item.children) : []
  }));
};

console.log(JSON.stringify(buildTemplate(SRS_TEMPLATE), null, 2));
