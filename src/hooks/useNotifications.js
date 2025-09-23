import { useContext } from "react";
import { NotificationContext } from "../contexts/NotificationContext";

export function useNotifications() {
  return useContext(NotificationContext);
}
