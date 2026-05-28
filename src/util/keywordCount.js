export default function keywordCount(data) {
  const counts = {};
  data.forEach((post) => {
    const keywords = JSON.parse(post.keywords);
    if (!keywords) return;

    Object.keys(keywords).forEach((keyword) => {
      counts[keyword] === undefined ? (counts[keyword] = 1) : counts[keyword]++;
    });
  });
  return counts;
}
