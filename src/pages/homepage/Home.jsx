import "./home.scss";
import Stories from "../../components/stories/Stories";
import Posts from "../../components/posts/Posts";

export default function Home() {
  return (
    <div className="home-container">
      <Stories />
      <Posts />
    </div>
  );
}
