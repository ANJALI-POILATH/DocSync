import { useProjectStore } from './src/store/useProjectStore.js';

// Setup mock state
useProjectStore.setState({
  projects: [{ id: 'test-1', documentType: 'BRD', sections: [] }]
});

console.log("Before:", useProjectStore.getState().projects[0].sections.length);

try {
  useProjectStore.getState().addSectionNode('test-1', null, { title: 'Test Section' });
  console.log("After:", useProjectStore.getState().projects[0].sections.length);
  console.log("Section:", useProjectStore.getState().projects[0].sections[0]);
} catch (e) {
  console.error("Error:", e);
}
