import "./stories.scss";
import storyImg from "../../assets/story.png";

export default function Stories() {
  // Temp data
  const story = [
    {
      id: 1,
      name: "test",
      img: storyImg,
    },
    {
      id: 3,
      name: "test",
      img: storyImg,
    },
    {
      id: 4,
      name: "test",
      img: storyImg,
    },
    {
      id: 5,
      name: "test",
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
