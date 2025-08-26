import "./stories.scss";
import storyImg from "../../assets/story.png";

export default function Stories() {
  // Temp data
  const story = [
    {
      id: 1,
      name: "Elena Zivojinovic",
      img: storyImg,
    },
    {
      id: 3,
      name: "Majmuncina lena",
      img: storyImg,
    },
    {
      id: 4,
      name: "autist djomla",
      img: storyImg,
    },
    {
      id: 5,
      name: "Njihov zajednicki nalog",
      img: storyImg,
    },
  ];

  return (
    <div className="stories-container">
      {story.map((story) => (
        <div className="story" key={story.id}>
          <img src={story.img} alt={story.name} />
          <span>{story.name}</span>
        </div>
      ))}
    </div>
  );
}
