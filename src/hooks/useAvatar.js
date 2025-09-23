import { useState, useEffect } from "react";
import placeholderImg from "../assets/placeholderImg.jpg";

export const useAvatar = (user) => {
  const [avatarSrc, setAvatarSrc] = useState(placeholderImg);

  useEffect(() => {
    // Simple fallback logic without preloading
    const src = user?.avatarUrl || user?.photoURL || placeholderImg;
    setAvatarSrc(src);
  }, [user?.avatarUrl, user?.photoURL, user?.uid]);

  return { avatarSrc };
};
