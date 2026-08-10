export default function remarkDemoteFirstHeading() {
  return (tree) => {
    const firstHeading = tree.children.find((node) => node.type === 'heading');
    if (firstHeading?.depth === 1) firstHeading.depth = 2;
  };
}
