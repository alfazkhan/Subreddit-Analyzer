import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useEffect, useMemo } from "react";
import { Bar, Line } from "react-chartjs-2";
// import faker from 'faker';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);
export const options = {
  responsive: true,
  plugins: {
    legend: {
      position: "top",
    },
    title: {
      display: true,
      text: "Sentiments Throughout the day",
    },
  },
  scales: {
    x: {
      border: {
        display: true,
      },
      grid: {
        display: true,
        drawOnChartArea: true,
        drawTicks: true,
      },
    },
    y: {
      border: {
        display: false,
      },
      grid: {
        color: "#fff",
      },
    },
  },
};

export default function EmotionsThroughoutDay({ data: postsData }) {
  const sentimentCounts = {
    Positive: 0,
    Neutral: 0,
    Negative: 0,
  };

  if (postsData) {
    postsData.forEach((post) => {
      if (sentimentCounts[post.sentiment] !== undefined) {
        sentimentCounts[post.sentiment]++;
      }
    });
  }
  // console.log(sentimentCounts);

  const hourlySentimentData = useMemo(() => {
    const counts = {
      Positive: Array(24).fill(0),
      Neutral: Array(24).fill(0),
      Negative: Array(24).fill(0),
    };

    postsData.forEach((post) => {
      if (!post.timestamp) return;
      const dateObj = new Date(post.timestamp);
      const localHour = dateObj.getHours();

      counts[post.sentiment][localHour]++;
    });

    return counts;
  }, [postsData]);

  const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  const data = {
    labels,
    datasets: [
      {
        label: "Positive",
        data: hourlySentimentData.Positive,
        borderColor: "#dd6b20",
        backgroundColor: "rgba(221, 107, 32, 0.1)",
        tension: 0.4,
        pointRadius: 4,
      },
      // {
      //   label: "Neutral",
      //   data: hourlySentimentData.Neutral,
      //   backgroundColor: "rgb(224, 206, 206)",
      //   borderColor: "rgb(224, 206, 206)",
      //   borderWidth: 1,
      // },
      {
        label: "Negative",
        data: hourlySentimentData.Negative,
        backgroundColor: "rgb(194, 36, 36)",
        borderColor: "rgb(194, 36, 36)",
        tension: 0.4,
        pointRadius: 4,
        // borderWidth: 1,
      },
    ],
  };
  return <Line options={options} data={data} />;
}
