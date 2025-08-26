import "./posts.scss";
import storyImg from "../../assets/story.png";
import { FaPaw, FaComment } from "react-icons/fa";

export default function Posts() {
  const posts = [
    {
      id: 1,
      name: "Elena Zivojinovic",
      userId: 1,
      profilePic: storyImg,
      desc: "ovo je skot od macke",
      img: storyImg,
    },
    {
      id: 2,
      name: "Stefan Blagojevic",
      userId: 2,
      profilePic: storyImg,
      desc: "Majmuneee",
      img: storyImg,
    },
    {
      id: 3,
      name: "Elena Zivojinovic",
      userId: 3,
      profilePic: storyImg,
      desc: "Majmuneee",
      img: storyImg,
    },
    {
      id: 4,
      name: "Elena Zivojinovic",
      userId: 4,
      profilePic: storyImg,
      desc: "Majmuneee",
      img: storyImg,
    },
  ];

  // Post

  const Post = ({ post }) => {
    return (
      <div className="post">
        <div className="post-cont">
          <div className="post-header">
            <img src={post.profilePic} alt="profile" />
            <span>{post.name}</span>
          </div>

          {post.img && <img src={post.img} alt="post content" />}
          <div className="interactions">
            <FaPaw />
            <FaComment />
          </div>
          <p>{post.desc}</p>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="post-container">
        {posts.map((post) => (
          <Post post={post} key={post.id} />
        ))}
      </div>
    </>
  );
}
