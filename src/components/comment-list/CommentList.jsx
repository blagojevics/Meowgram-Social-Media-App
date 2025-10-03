import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "../../../config/firebase";
import CommentItem from "../commentitem/CommentItem";
import "./commentList.scss";

export default function CommentList({
  postId,
  currentUser,
  isPostOwner,
  post,
}) {
  const [comments, setComments] = useState([]);

  useEffect(() => {
    if (!postId) return;
    const q = query(
      collection(db, "comments"),
      where("postId", "==", postId),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, async (snap) => {
      const commentsData = [];
      const updatesNeeded = [];

      snap.docs.forEach((d) => {
        const data = d.data();
        const commentData = {
          id: d.id,
          ...data,
          createdAt: data.createdAt || { toDate: () => new Date(0) },
          likes: data.likes || [], // Ensure likes field always exists
        };
        commentsData.push(commentData);

        // If this comment doesn't have a likes field in Firestore, we need to add it
        if (!data.likes) {
          updatesNeeded.push(
            updateDoc(doc(db, "comments", d.id), { likes: [] })
          );
        }
      });

      setComments(commentsData);

      // Update comments that don't have likes field (run in background)
      if (updatesNeeded.length > 0) {
        Promise.all(updatesNeeded).catch(console.error);
      }
    });
    return () => unsub();
  }, [postId]);

  const handleDelete = async (comment) => {
    if (isPostOwner || comment.authorId === currentUser.uid) {
      await deleteDoc(doc(db, "comments", comment.id));
      await updateDoc(doc(db, "posts", postId), {
        commentsCount: increment(-1),
      });
    }
  };

  return (
    <div className="comments-list">
      {comments.map((c) => (
        <CommentItem
          key={c.id}
          comment={c}
          currentUser={currentUser}
          isPostOwner={isPostOwner}
          onDelete={handleDelete}
          post={post}
        />
      ))}
    </div>
  );
}
