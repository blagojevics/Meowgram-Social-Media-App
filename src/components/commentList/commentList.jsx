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
import { db } from "../../config/firebase";

export default function CommentList({
  postId,
  currentUser,
  isPostOwner,
  onClose,
}) {
  const [comments, setComments] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "comments"),
      where("postId", "==", postId),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
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
    <div>
      <button onClick={onClose}>Close</button>
      {comments.map((c) => (
        <div key={c.id}>
          <span>{c.username}</span>
          <span>{c.text}</span>
          {(isPostOwner || c.authorId === currentUser.uid) && (
            <button onClick={() => handleDelete(c)}>Delete</button>
          )}
        </div>
      ))}
    </div>
  );
}
